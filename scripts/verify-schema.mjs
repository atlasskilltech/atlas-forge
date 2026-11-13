/**
 * Schema verification.
 *
 *   npm run db:verify
 *
 * Confirms every table exists with the right engine and collation, and reports
 * foreign keys, indexes and CHECK constraints. Exits non-zero on any deviation
 * so it can gate a deployment.
 */
import mysql from 'mysql2/promise'
import { dbEnv, forgeTables } from './lib/forge-db.mjs'

// Only ATLAS Forge's own tables are checked. The production database is shared
// with other applications; their tables are neither expected nor reported.
const cfg = dbEnv()
const DB_NAME = cfg.database
const EXPECTED = [...(await forgeTables()).keys()].sort()

const conn = await mysql.createConnection(cfg)

let failures = 0
const fail = (msg) => { failures += 1; console.log(`  FAIL  ${msg}`) }

// --- database defaults -----------------------------------------------------
const [[schema]] = await conn.query(
  `SELECT DEFAULT_CHARACTER_SET_NAME cs, DEFAULT_COLLATION_NAME co
     FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`, [DB_NAME])
console.log(`\ndatabase  ${DB_NAME}  ${schema.cs} / ${schema.co}`)
// The database default belongs to whoever created it (shared in production);
// what matters is each Forge table's own collation, checked below.
if (schema.co !== 'utf8mb4_unicode_ci') console.log(`  note  database default collation is ${schema.co}`)

// --- tables ----------------------------------------------------------------
const [tables] = await conn.query(
  `SELECT TABLE_NAME name, ENGINE engine, TABLE_COLLATION collation
     FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME IN (?)
    ORDER BY TABLE_NAME`, [DB_NAME, EXPECTED])

const found = tables.map((t) => t.name)
for (const name of EXPECTED) if (!found.includes(name)) fail(`missing table: ${name}`)
for (const t of tables) {
  if (t.engine !== 'InnoDB') fail(`${t.name} engine is ${t.engine}`)
  if (t.collation !== 'utf8mb4_unicode_ci') fail(`${t.name} collation is ${t.collation}`)
}

// --- constraints -----------------------------------------------------------
const count = async (sql, params) => (await conn.query(sql, params))[0][0].n

const fks = await count(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME IN (?) AND CONSTRAINT_TYPE = 'FOREIGN KEY'`, [DB_NAME, EXPECTED])
const uniques = await count(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME IN (?) AND CONSTRAINT_TYPE = 'UNIQUE'`, [DB_NAME, EXPECTED])
const pks = await count(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME IN (?) AND CONSTRAINT_TYPE = 'PRIMARY KEY'`, [DB_NAME, EXPECTED])
const indexes = await count(
  `SELECT COUNT(DISTINCT TABLE_NAME, INDEX_NAME) n FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (?)`, [DB_NAME, EXPECTED])

let checks = 0
try {
  checks = await count(
    `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME IN (?) AND CONSTRAINT_TYPE = 'CHECK'`, [DB_NAME, EXPECTED])
} catch { checks = -1 }

// --- referential actions ---------------------------------------------------
const [actions] = await conn.query(
  `SELECT DELETE_RULE rule, COUNT(*) n FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME IN (?) GROUP BY DELETE_RULE ORDER BY n DESC`, [DB_NAME, EXPECTED])

// --- the deferred circular FK ---------------------------------------------
const [[circular]] = await conn.query(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'startups'
      AND CONSTRAINT_NAME = 'fk_startups_mentor'`, [DB_NAME])
if (circular.n !== 1) fail('deferred FK fk_startups_mentor was not created')

console.log(`\ntables            ${tables.length} / ${EXPECTED.length} expected`)
console.log(`primary keys      ${pks}`)
console.log(`foreign keys      ${fks}`)
console.log(`unique keys       ${uniques}`)
console.log(`indexes (total)   ${indexes}`)
console.log(`check constraints ${checks < 0 ? 'n/a on this server' : checks}`)
console.log(`\nON DELETE rules`)
for (const a of actions) console.log(`  ${a.rule.padEnd(12)}${a.n}`)

await conn.end()

if (failures === 0) {
  console.log(`\nSchema verified — no deviations.\n`)
  process.exit(0)
}
console.log(`\n${failures} problem(s) found.\n`)
process.exit(1)
