/**
 * Applies database/schema.sql.
 *
 *   npm run db:schema
 *
 * Uses mysql2 and the same env vars as the app, so it works on any machine
 * without the mysql CLI on PATH and follows .env.local to any server.
 *
 * DESTRUCTIVE — schema.sql drops every table before recreating it. Refuses to
 * run against a database that already holds data unless --force is passed.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import mysql from 'mysql2/promise'

const {
  DB_HOST, DB_PORT = '3306', DB_USER, DB_PASSWORD = '', DB_NAME,
} = process.env

const force = process.argv.includes('--force')
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const schemaPath = join(root, 'database', 'schema.sql')

console.log(`\nApplying schema to ${DB_HOST}:${DB_PORT}/${DB_NAME}`)

// Connect without selecting a database so we can create it if needed.
const bootstrap = await mysql.createConnection({
  host: DB_HOST, port: Number(DB_PORT), user: DB_USER, password: DB_PASSWORD,
  multipleStatements: true,
})

await bootstrap.query(
  `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
     CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
)

// Guard against wiping a populated database by accident.
const [[{ rowsPresent }]] = await bootstrap.query(
  `SELECT COALESCE(SUM(TABLE_ROWS), 0) AS rowsPresent
     FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
  [DB_NAME]
)

if (Number(rowsPresent) > 0 && !force) {
  console.error(
    `\nRefusing to run: ${DB_NAME} already contains data (~${rowsPresent} rows).\n` +
      'schema.sql drops every table. Re-run with --force if that is intended.\n'
  )
  await bootstrap.end()
  process.exit(1)
}

const sql = await readFile(schemaPath, 'utf8')
try {
  await bootstrap.query(sql)
  console.log('Schema applied successfully.')
} catch (error) {
  console.error(`\nSchema failed: ${error.code} — ${error.sqlMessage ?? error.message}\n`)
  await bootstrap.end()
  process.exit(1)
}

await bootstrap.end()
console.log('Run `npm run db:verify` to confirm.\n')
