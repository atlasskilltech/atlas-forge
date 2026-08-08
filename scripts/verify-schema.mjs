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

const {
  DB_HOST, DB_PORT = '3306', DB_USER, DB_PASSWORD = '', DB_NAME,
} = process.env

const EXPECTED = [
  'roles', 'permissions', 'role_permissions', 'users', 'user_roles', 'sessions',
  'skills', 'student_profiles', 'student_skills',
  'industries', 'stages', 'startups', 'startup_members',
  'listing_types', 'contract_types', 'listings', 'listing_skills',
  'applications', 'application_events', 'approvals',
  'concierge_contacts', 'posted_needs',
  'mentor_types', 'mentors', 'mentor_skills',
  'mentorship_requests', 'mentorship_sessions',
  'readiness_items', 'incubation_applications', 'application_readiness',
  'founder_access_grants',
  'contracts', 'platform_settings', 'activity_logs', 'error_logs',
  'notifications', 'messages',
  'login_attempts',
]

const conn = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER,
  password: DB_PASSWORD, database: DB_NAME,
})

let failures = 0
const fail = (msg) => { failures += 1; console.log(`  FAIL  ${msg}`) }

// --- database defaults -----------------------------------------------------
const [[schema]] = await conn.query(
  `SELECT DEFAULT_CHARACTER_SET_NAME cs, DEFAULT_COLLATION_NAME co
     FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`, [DB_NAME])
console.log(`\ndatabase  ${DB_NAME}  ${schema.cs} / ${schema.co}`)
if (schema.co !== 'utf8mb4_unicode_ci') fail(`database collation is ${schema.co}`)

// --- tables ----------------------------------------------------------------
const [tables] = await conn.query(
  `SELECT TABLE_NAME name, ENGINE engine, TABLE_COLLATION collation
     FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    ORDER BY TABLE_NAME`, [DB_NAME])

const found = tables.map((t) => t.name)
for (const name of EXPECTED) if (!found.includes(name)) fail(`missing table: ${name}`)
for (const name of found) if (!EXPECTED.includes(name)) fail(`unexpected table: ${name}`)
for (const t of tables) {
  if (t.engine !== 'InnoDB') fail(`${t.name} engine is ${t.engine}`)
  if (t.collation !== 'utf8mb4_unicode_ci') fail(`${t.name} collation is ${t.collation}`)
}

// --- constraints -----------------------------------------------------------
const count = async (sql, params) => (await conn.query(sql, params))[0][0].n

const fks = await count(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'`, [DB_NAME])
const uniques = await count(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_TYPE = 'UNIQUE'`, [DB_NAME])
const pks = await count(
  `SELECT COUNT(*) n FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? AND CONSTRAINT_TYPE = 'PRIMARY KEY'`, [DB_NAME])
const indexes = await count(
  `SELECT COUNT(DISTINCT TABLE_NAME, INDEX_NAME) n FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = ?`, [DB_NAME])

let checks = 0
try {
  checks = await count(
    `SELECT COUNT(*) n FROM information_schema.CHECK_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = ?`, [DB_NAME])
} catch { checks = -1 }

// --- referential actions ---------------------------------------------------
const [actions] = await conn.query(
  `SELECT DELETE_RULE rule, COUNT(*) n FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = ? GROUP BY DELETE_RULE ORDER BY n DESC`, [DB_NAME])

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
