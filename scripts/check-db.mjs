/**
 * READ-ONLY database check for ATLAS Forge.
 *
 *   npm run db:check
 *
 * Uses exactly the configuration the running app uses: the project's `.env`,
 * loaded by `node --env-file=.env` (the same flag PM2 starts Next with). It
 * never prints the password and never writes anything — it runs SELECTs and
 * reads information_schema only, so it is safe against the shared production
 * database.
 *
 * Exits non-zero if the app could not work: connection failure, missing Forge
 * tables, a Forge-named table that belongs to another application, or another
 * env file that changes DB_* settings behind .env's back.
 */
import { existsSync, readFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import mysql from 'mysql2/promise'
import { dbEnv, describe, envFileConflicts, inspectDatabase } from './lib/forge-db.mjs'

const cfg = dbEnv()
const line = (label, value) => console.log(`  ${label.padEnd(22)}${value}`)
let failed = false
const fail = (label, value) => { failed = true; line(`FAIL ${label}`, value) }

console.log('\nATLAS Forge — read-only database check')
line('target', describe(cfg))

// 1a. `--env-file` never overrides a variable already set in the shell, so a
//     stale `export DB_NAME=...` would make this check (but not the app, whose
//     PM2 config filters the shell env) test the wrong database.
if (existsSync('.env')) {
  const fromFile = parseEnv(readFileSync('.env', 'utf8'))
  const overridden = Object.keys(fromFile)
    .filter((k) => k.startsWith('DB_') && process.env[k] !== fromFile[k])
  if (overridden.length > 0) {
    fail('shell override', `${overridden.join(', ')} set in your shell differ from .env — unset them and re-run`)
  }
}

// 1b. Other env files that could change DB_* settings at runtime.
for (const { file, fillsMissing, differs } of envFileConflicts()) {
  if (fillsMissing.length > 0) fail(file, `supplies ${fillsMissing.join(', ')} that .env lacks — add them to .env`)
  if (differs.length > 0) line(`note ${file}`, `differs on ${differs.join(', ')} (ignored: .env wins)`)
}

// 2. Connect exactly as the app's pool does (on DB_NAME, no database created).
let conn
try {
  conn = await mysql.createConnection({ ...cfg, multipleStatements: false })
} catch (error) {
  fail('connect', `${error.code ?? 'ERROR'}: ${error.sqlMessage ?? error.message}`)
  console.log('\nChecks failed.\n')
  process.exit(1)
}

try {
  const [[who]] = await conn.query(
    'SELECT DATABASE() AS db, CURRENT_USER() AS account, VERSION() AS version, 1 AS ok'
  )
  line('connected', `MySQL ${who.version} as ${who.account}`)
  line('database in use', who.db)
  if (who.db !== cfg.database) fail('database', `expected ${cfg.database}, got ${who.db}`)

  // 3. Table inventory (information_schema only).
  const inv = await inspectDatabase(conn)
  line('forge tables', `${inv.present.length}/${inv.expected.length} present`)
  if (inv.missing.length > 0) fail('missing tables', inv.missing.join(', '))
  for (const { name, lacking } of inv.collisions) {
    fail('foreign table', `${name} exists but is not Forge's (lacks ${lacking.slice(0, 4).join(', ')})`)
  }
  line('other apps\' tables', `${inv.foreign.length} (left untouched)`)

  // 4. A real read through a prepared statement, as the app's repositories do.
  if (inv.present.includes('users')) {
    const [[row]] = await conn.execute('SELECT COUNT(*) AS n FROM users WHERE deleted_at IS NULL')
    line('read users', `ok (${row.n} active rows)`)
  }
  if (inv.present.includes('roles')) {
    const [[row]] = await conn.execute('SELECT COUNT(*) AS n FROM roles')
    line('read roles', `ok (${row.n} rows)${row.n === 0 ? ' — run db:reference' : ''}`)
  }
} catch (error) {
  fail('query', `${error.code ?? 'ERROR'}: ${error.sqlMessage ?? error.message}`)
} finally {
  await conn.end()
}

console.log(failed ? '\nChecks failed.\n' : '\nAll checks passed.\n')
process.exit(failed ? 1 : 0)
