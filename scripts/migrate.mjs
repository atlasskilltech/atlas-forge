/**
 * ATLAS Forge — schema migration CLI (general runner).
 *
 *   node --env-file=<file> scripts/migrate.mjs status
 *   node --env-file=<file> scripts/migrate.mjs up [--dry-run] [--maintenance] [--backup=<file>]
 *   node --env-file=<file> scripts/migrate.mjs baseline [--force]
 *   node --env-file=<file> scripts/migrate.mjs down --confirm --backup=<file>
 *   node --env-file=<file> scripts/migrate.mjs fingerprint        # LOCAL only: (re)build the expected-schema artifact
 *
 * Safety:
 *   - ADDITIVE, online-safe migrations only on `up`; blocking/maintenance ones
 *     need --maintenance (the deploy sets this ONLY inside a window).
 *   - Only forge_ tables (enforced in scripts/lib/migrate-core.mjs).
 *   - REFUSES a non-local database unless BOTH FORGE_MIGRATE_REMOTE_OK=1 AND
 *     NODE_ENV=production (true only on the EC2 server) — never from a laptop.
 *   - `baseline` STRUCTURALLY verifies the live schema against the expected
 *     fingerprint and ABORTS on any mismatch.
 *   - For a non-local target, `up` requires a verified --backup; `down` always
 *     requires --confirm and a verified --backup.
 */
import mysql from 'mysql2/promise'
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ROOT, dbEnv, describe } from './lib/forge-db.mjs'
import {
  loadAllMigrations, loadBaselineMigrations, mysqlAdapter, computeStatus, applyPending, recordBaseline, migrateDown,
  DEFAULT_LOCK_WAIT, DEFAULT_MAX_STATEMENT_TIME,
} from './lib/migrate-core.mjs'
import { snapshotForge, diffForge, buildExpectedFromSchemaSql } from './lib/schema-fingerprint.mjs'

const [cmd, ...rest] = process.argv.slice(2)
const has = (f) => rest.includes(f)
const opt = (name) => { const a = rest.find((x) => x.startsWith(`${name}=`)); return a ? a.slice(name.length + 1) : null }
const log = (...a) => console.log(...a)

const FINGERPRINT_FILE = join(ROOT, 'database', 'expected-schema.fingerprint.json')
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])
const isLocal = (cfg) => LOCAL_HOSTS.has(cfg.host)

function assertRunLocation(cfg) {
  if (isLocal(cfg)) return
  // Remote (production) is allowed ONLY on the EC2 server, which both sets the
  // deploy flag AND runs with NODE_ENV=production. A laptop has neither.
  if (process.env.FORGE_MIGRATE_REMOTE_OK === '1' && process.env.NODE_ENV === 'production') return
  console.error(`\nRefusing to run migrations against a non-local database (${cfg.host}) from here.`)
  console.error('Production migrations run ONLY on the EC2 server (FORGE_MIGRATE_REMOTE_OK=1 AND NODE_ENV=production).')
  console.error('For local work, point DB_* at a local database (never .env.local, which targets production).\n')
  process.exit(2)
}

/** A verified backup argument: the file must exist and be non-empty. */
function backupVerified() {
  const path = opt('--backup')
  if (!path) return false
  try { return existsSync(path) && statSync(path).size > 0 } catch { return false }
}

/** Load the expected-schema fingerprint (committed artifact preferred; built on
 *  the fly for a LOCAL target when the artifact is absent). */
/** Ordered flat list of the baseline migrations' SQL statements (001–012), used
 *  to fold migration-only tables/columns into the expected schema. */
async function baselineStatements() {
  const base = await loadBaselineMigrations(join(ROOT, 'database'))
  return base.filter((m) => Array.isArray(m.up)).flatMap((m) => m.up)
}

async function loadExpected(cfg) {
  if (existsSync(FINGERPRINT_FILE)) {
    return { expected: JSON.parse(await readFile(FINGERPRINT_FILE, 'utf8')), origin: 'artifact' }
  }
  if (isLocal(cfg)) {
    const schemaSql = await readFile(join(ROOT, 'database', 'schema.sql'), 'utf8')
    const expected = await buildExpectedFromSchemaSql(cfg, schemaSql, `forge_schema_expected_${process.pid}`, await baselineStatements())
    return { expected, origin: 'built-from-schema.sql+migrations (local scratch db)' }
  }
  throw new Error(`no expected-schema fingerprint at ${FINGERPRINT_FILE}. Generate it locally with "migrate.mjs fingerprint" and commit it before baselining a remote database.`)
}

function makeStructuralVerify(conn, expected, origin) {
  return async () => {
    const actual = await snapshotForge(conn)
    const problems = diffForge(expected.tables ? expected : { tables: expected }, actual)
    // Also flag any Forge table still under a legacy (unprefixed) name is handled
    // by diffForge (missing forge_ table); unexpected forge_ tables are flagged too.
    return {
      ok: problems.length === 0,
      problems,
      summary: `structural match against ${origin}: ${actual.forgeTableNames.length} forge_ tables, ${actual.allTableNames.length - actual.forgeTableNames.length} other table(s) untouched`,
    }
  }
}

async function main() {
  if (!cmd || !['status', 'up', 'baseline', 'down', 'fingerprint'].includes(cmd)) {
    console.error('Usage: migrate.mjs <status|up|baseline|down|fingerprint> [--dry-run|--maintenance|--confirm|--force|--backup=<file>]')
    process.exit(1)
  }
  const cfg = dbEnv()

  // `fingerprint` is a LOCAL-ONLY generator (it creates a scratch database).
  if (cmd === 'fingerprint') {
    if (!isLocal(cfg)) { console.error('\nfingerprint is local-only (it creates a scratch database). Run it against a local DB.\n'); process.exit(2) }
    const schemaSql = await readFile(join(ROOT, 'database', 'schema.sql'), 'utf8')
    const expected = await buildExpectedFromSchemaSql(cfg, schemaSql, `forge_schema_expected_${process.pid}`, await baselineStatements())
    await writeFile(FINGERPRINT_FILE, JSON.stringify(expected, null, 2))
    log(`\nWrote expected-schema fingerprint (${Object.keys(expected.tables).length} forge_ tables) to:\n  ${FINGERPRINT_FILE}\n`)
    process.exit(0)
  }

  assertRunLocation(cfg)

  const migrations = await loadAllMigrations(join(ROOT, 'database'))
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: false })
  const db = mysqlAdapter(conn)
  let exitCode = 0
  try {
    log(`\nATLAS Forge migrations — ${cmd}`)
    log(`  target   ${describe(cfg)}`)

    if (cmd === 'status') {
      const s = await computeStatus(db, migrations)
      log(`  server   ${s.serverVersion}  database ${s.database}`)
      log(`  applied  ${s.applied.length} (${s.applied.filter((a) => a.source === 'baseline').length} baseline, ${s.applied.filter((a) => a.source === 'managed').length} managed)`)
      if (s.pending.length) {
        for (const p of s.pending) log(`  pending  ${p.id} [${p.onlineSafe ? 'online-safe' : 'MAINTENANCE-ONLY'}]${p.reasons.length ? ' — ' + p.reasons.join('; ') : ''}`)
      } else log('  pending  none')
      if (s.baselinePending.length) log(`  baseline not yet recorded: ${s.baselinePending.join(', ')}`)
      for (const p of s.problems) log(`  problem  ${p}`)
      log(s.pending.length ? '\nSTATUS: PENDING' : '\nSTATUS: UP-TO-DATE')
      if (s.problems.length) exitCode = 1
    } else if (cmd === 'up') {
      const r = await applyPending(db, migrations, {
        dryRun: has('--dry-run'),
        maintenance: has('--maintenance'),
        requireBackup: !isLocal(cfg),
        backupVerified: backupVerified(),
        lockWaitTimeout: Number(process.env.MIGRATE_LOCK_WAIT || DEFAULT_LOCK_WAIT),
        maxStatementTime: Number(process.env.MIGRATE_MAX_STATEMENT_TIME ?? DEFAULT_MAX_STATEMENT_TIME),
        log: (m) => log(`  ${m}`),
      })
      log(r.dryRun ? '\nDRY-RUN complete (nothing changed).' : `\nApplied: ${r.applied.length ? r.applied.join(', ') : 'none'}`)
    } else if (cmd === 'baseline') {
      const { expected, origin } = await loadExpected(cfg)
      const r = await recordBaseline(db, migrations, { verifySchema: makeStructuralVerify(conn, expected, origin), force: has('--force'), log: (m) => log(`  ${m}`) })
      log(`\nBaseline recorded: ${r.recorded.join(', ')}`)
    } else if (cmd === 'down') {
      const r = await migrateDown(db, migrations, { confirm: has('--confirm'), backupVerified: backupVerified(), log: (m) => log(`  ${m}`) })
      log(`\nReverted: ${r.reverted || 'nothing'}`)
    }
  } catch (error) {
    console.error(`\nFAILED: ${error.code ? `[${error.code}] ` : ''}${error.message}`)
    exitCode = 1
  } finally {
    await conn.end()
  }
  process.exit(exitCode)
}

main()
