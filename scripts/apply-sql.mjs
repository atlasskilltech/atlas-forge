/**
 * Applies an additive SQL file from database/ to DB_NAME (from .env).
 *
 *   npm run db:reference
 *   npm run db:migrate -- migrations/012_x.sql
 *   npm run db:seed                          (development only — see below)
 *
 * Guard rails, all checked before any statement runs:
 *
 *   - the file may not contain USE / CREATE|ALTER|DROP DATABASE, so it can only
 *     touch the database the connection was opened on (DB_NAME),
 *   - if any table with a Forge name exists but is not Forge's (another
 *     application's table in a shared database), nothing runs,
 *   - seed.sql (demo accounts and content) is refused on a shared database.
 *
 * These files are written to be idempotent, so re-running one is a no-op.
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import mysql from 'mysql2/promise'
import {
  ROOT, dbEnv, describe, assertScopedSql, inspectDatabase, assertNoCollisions, assertNotLegacy,
} from './lib/forge-db.mjs'

const file = process.argv[2]
if (!file) {
  console.error('Usage: apply-sql.mjs <file.sql>   (path relative to database/)')
  process.exit(1)
}

const cfg = dbEnv()
const sql = await readFile(join(ROOT, 'database', file), 'utf8')
assertScopedSql(sql, file)

console.log(`\nApplying ${file} to ${describe(cfg)}`)

const conn = await mysql.createConnection({ ...cfg, multipleStatements: true })

try {
  const inventory = await inspectDatabase(conn)
  assertNoCollisions(inventory, file)
  assertNotLegacy(inventory, file)

  if (/(^|\/)seed\.sql$/.test(file) && inventory.foreign.length > 0) {
    console.error(
      `\nRefusing to apply ${file}: it is DEMO data (shared demo passwords) and ` +
        `${cfg.database} is shared with other applications, i.e. production.\n`
    )
    process.exit(1)
  }

  await conn.query(sql)
  console.log(`${file} applied successfully.\n`)
} catch (error) {
  console.error(`\n${file} FAILED: ${error.code} — ${error.sqlMessage ?? error.message}\n`)
  process.exitCode = 1
} finally {
  await conn.end()
}
