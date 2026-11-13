/**
 * READ-ONLY content fingerprint of tables: exact row count and a sha256 over
 * every row in primary-key order. Used to prove that a backup restores to
 * exactly the same data, and that the prefix migration changes no data.
 *
 *   node --env-file=<env> scripts/ops/table-hashes.mjs --forge  --out=<file>
 *   node --env-file=<env> scripts/ops/table-hashes.mjs --others --out=<file>
 *
 * --forge  the 46 Forge tables, keyed by LOGICAL name (whether the database
 *          currently uses the legacy or the forge_ names)
 * --others every other table, keyed by its name
 *
 * Runs in one READ ONLY consistent-snapshot transaction. Prints only counts
 * and hashes — never row data.
 */
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import mysql from 'mysql2/promise'
import { dbEnv } from '../lib/forge-db.mjs'
import { LOGICAL_TABLES, TABLE_RENAMES } from '../../src/lib/queries/tables.mjs'

const args = process.argv.slice(2)
const mode = args.includes('--others') ? 'others' : 'forge'
const outFile = args.find((a) => a.startsWith('--out='))?.slice(6)
const quiet = args.includes('--quiet')

const conn = await mysql.createConnection({
  ...dbEnv(),
  // Exact, timezone-free values: dates as stored strings, big numbers as strings.
  dateStrings: true, supportBigNumbers: true, bigNumberStrings: true, decimalNumbers: false,
  typeCast: (field, next) => (field.type === 'JSON' ? field.string() : next()),
})
await conn.query('SET SESSION TRANSACTION READ ONLY')
await conn.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY')

const [tables] = await conn.query(
  `SELECT TABLE_NAME n FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`
)
const existing = new Set(tables.map((t) => t.n))
const forgeNames = new Set([...LOGICAL_TABLES, ...Object.values(TABLE_RENAMES)])

let targets // [key, physical]
if (mode === 'forge') {
  targets = LOGICAL_TABLES.map((l) => [l, existing.has(TABLE_RENAMES[l]) ? TABLE_RENAMES[l] : existing.has(l) ? l : null])
} else {
  targets = [...existing].filter((n) => !forgeNames.has(n)).sort().map((n) => [n, n])
}

const result = {}
for (const [key, physical] of targets) {
  if (!physical) { result[key] = { missing: true }; continue }
  const [pk] = await conn.query(
    `SELECT COLUMN_NAME c FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = 'PRIMARY'
      ORDER BY ORDINAL_POSITION`, [physical])
  const [cols] = await conn.query(
    `SELECT COLUMN_NAME c FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION`, [physical])
  const order = (pk.length ? pk : cols).map((r) => `\`${r.c}\``).join(', ')
  const [rows] = await conn.query({ sql: `SELECT * FROM \`${physical}\` ORDER BY ${order}`, rowsAsArray: true })
  const h = createHash('sha256')
  for (const row of rows) {
    h.update(JSON.stringify(row.map((v) => (Buffer.isBuffer(v) ? `0x${v.toString('hex')}` : v))))
    h.update('\n')
  }
  result[key] = { table: physical, rows: rows.length, sha256: h.digest('hex') }
}
await conn.query('COMMIT')
await conn.end()

const total = Object.values(result).reduce((s, r) => s + (r.rows ?? 0), 0)
if (!quiet) {
  console.log(`  ${mode} tables hashed: ${Object.keys(result).length}, rows: ${total}, ` +
    `missing: ${Object.values(result).filter((r) => r.missing).length}`)
}
if (outFile) writeFileSync(outFile, JSON.stringify(result, null, 2))
