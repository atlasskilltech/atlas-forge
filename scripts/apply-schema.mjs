/**
 * Applies database/schema.sql — a FULL REBUILD for a dedicated, empty
 * development database only.
 *
 *   npm run db:schema
 *
 * DESTRUCTIVE — schema.sql drops every Forge table before recreating it. It is
 * therefore refused, even with --force, whenever:
 *
 *   - the database also holds tables that are not ATLAS Forge's (a shared
 *     database such as production, which Atlas News and Research Portal use),
 *   - a table with a Forge name exists but belongs to another application.
 *
 * It never creates, alters or switches databases: the connection is opened on
 * DB_NAME from .env and the SQL file may not name any database. Existing
 * production databases are updated with database/migrations/ (db:migrate).
 */
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import mysql from 'mysql2/promise'
import {
  ROOT, dbEnv, describe, assertScopedSql, inspectDatabase, assertNoCollisions, assertNotLegacy,
} from './lib/forge-db.mjs'

const force = process.argv.includes('--force')
const cfg = dbEnv()
const sql = await readFile(join(ROOT, 'database', 'schema.sql'), 'utf8')
assertScopedSql(sql, 'schema.sql')

console.log(`\nApplying schema to ${describe(cfg)}`)

// Connects to DB_NAME only; fails (rather than creating anything) if it does not exist.
const conn = await mysql.createConnection({ ...cfg, multipleStatements: true })

try {
  const inventory = await inspectDatabase(conn)
  assertNoCollisions(inventory, 'schema.sql')
  assertNotLegacy(inventory, 'schema.sql')

  if (inventory.foreign.length > 0) {
    console.error(
      `\nRefusing to run: ${cfg.database} also contains ${inventory.foreign.length} table(s) ` +
        'that are not ATLAS Forge\'s, so it is shared with other applications.\n' +
        'schema.sql is a destructive rebuild and is never run on a shared database ' +
        '(--force does not override this). Use `npm run db:migrate -- migrations/<file>.sql` instead.\n'
    )
    process.exit(1)
  }

  if (inventory.present.length > 0 && !force) {
    console.error(
      `\nRefusing to run: ${inventory.present.length} ATLAS Forge table(s) already exist in ` +
        `${cfg.database}. schema.sql drops them. Re-run with --force only on a disposable ` +
        'development database.\n'
    )
    process.exit(1)
  }

  await conn.query(sql)
  console.log('Schema applied successfully.')
} catch (error) {
  console.error(`\nSchema failed: ${error.code} — ${error.sqlMessage ?? error.message}\n`)
  process.exitCode = 1
} finally {
  await conn.end()
}

if (!process.exitCode) console.log('Run `npm run db:verify` to confirm.\n')
