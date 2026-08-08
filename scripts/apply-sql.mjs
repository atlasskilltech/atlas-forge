/**
 * Applies a SQL file from database/ using the app's own env configuration.
 *
 *   node --env-file=.env.local scripts/apply-sql.mjs reference-data.sql
 *   node --env-file=.env.local scripts/apply-sql.mjs migrations/001_x.sql
 *
 * Used by `npm run db:reference`, `npm run db:seed` and `npm run db:migrate`.
 * Unlike apply-schema, these files are additive and idempotent, so there is no
 * destructive guard — a migration must be written so that re-running it is a
 * no-op.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import mysql from 'mysql2/promise'

const file = process.argv[2]
if (!file) {
  console.error('Usage: apply-sql.mjs <file.sql>')
  process.exit(1)
}

const { DB_HOST, DB_PORT = '3306', DB_USER, DB_PASSWORD = '', DB_NAME } = process.env
const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const connection = await mysql.createConnection({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  multipleStatements: true,
})

console.log(`\nApplying ${file} to ${DB_HOST}:${DB_PORT}/${DB_NAME}`)

try {
  const sql = await readFile(join(root, 'database', file), 'utf8')
  await connection.query(sql)
  console.log(`${file} applied successfully.\n`)
} catch (error) {
  console.error(`\n${file} FAILED: ${error.code} — ${error.sqlMessage ?? error.message}\n`)
  await connection.end()
  process.exit(1)
}

await connection.end()
