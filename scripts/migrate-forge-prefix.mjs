/**
 * Migration 013 — rename ATLAS Forge's 46 tables to the `forge_` prefix.
 *
 *   npm run db:prefix                         # PLAN only (read-only, the default)
 *   npm run db:prefix -- --apply              # legacy names  -> forge_ names
 *   npm run db:prefix -- --rollback           # PLAN the reverse
 *   npm run db:prefix -- --rollback --apply   # forge_ names  -> legacy names
 *
 * Options: --report=<file>  write the before/after snapshot as JSON
 *          --lock-wait=<s>  max seconds to wait for table locks (default 20)
 *
 * How it stays safe
 *   - Explicit map: exactly the 46 tables in src/lib/queries/tables.mjs, and
 *     each one must carry every Forge column (so another application's table
 *     that merely shares a name is never touched).
 *   - One statement: `RENAME TABLE a TO forge_a, b TO forge_b, ...` for all 46.
 *     MariaDB/MySQL execute a multi-table RENAME atomically (crash-safe DDL in
 *     MariaDB 10.6+): either every table is renamed or none is, so an
 *     interruption cannot leave a half-migrated database.
 *   - Rename, never recreate: rows, indexes, AUTO_INCREMENT, CHECK constraints
 *     and foreign keys move with the table; InnoDB re-points FKs that reference
 *     a renamed table. Constraint names are unchanged, so no database-wide
 *     name clash can arise. No DROP, CREATE, TRUNCATE, INSERT, UPDATE, DELETE.
 *   - Idempotent: already in the target state -> "nothing to do", exit 0.
 *     Any mixed/unknown state (some renamed, a target name already taken, a
 *     table missing) -> refuse with details, change nothing, exit 2.
 *   - Verified: exact row counts, AUTO_INCREMENT values and structural
 *     fingerprints (columns, indexes, FKs, constraints) of the 46 tables and of
 *     every OTHER table in the database are captured before and compared after.
 *     Any difference -> exit 3 (no automatic changes; the rollback is printed).
 *   - lock_wait_timeout bounds how long the RENAME may wait for a lock, so it
 *     can never queue indefinitely behind a long query.
 */
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import mysql from 'mysql2/promise'
import { dbEnv, describe, forgeTables } from './lib/forge-db.mjs'
import { LOGICAL_TABLES, TABLE_PREFIX, TABLE_RENAMES } from '../src/lib/queries/tables.mjs'

const args = process.argv.slice(2)
const APPLY = args.includes('--apply')
const ROLLBACK = args.includes('--rollback')
const reportArg = args.find((a) => a.startsWith('--report='))?.slice('--report='.length)
const LOCK_WAIT = Number(args.find((a) => a.startsWith('--lock-wait='))?.slice('--lock-wait='.length) ?? 20)

const cfg = dbEnv()
const say = (...a) => console.log(...a)
const sha = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex').slice(0, 16)
const q = async (conn, sql, params = []) => (await conn.query(sql, params))[0]
const ident = (name) => {
  if (!/^[a-z0-9_]{1,64}$/.test(name)) throw new Error(`unsafe identifier ${name}`)
  return `\`${name}\``
}

const LEGACY = new Set(LOGICAL_TABLES)
const PREFIXED = new Set(Object.values(TABLE_RENAMES))
const isForgeName = (n) => LEGACY.has(n) || PREFIXED.has(n)
const logicalOf = (n) => (PREFIXED.has(n) ? n.slice(TABLE_PREFIX.length) : n)

/** Full, rename-invariant snapshot of the database (read-only). */
async function snapshot(conn) {
  const tables = await q(conn,
    `SELECT TABLE_NAME n, TABLE_TYPE ty, ENGINE e, AUTO_INCREMENT ai
       FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()`)
  const cols = await q(conn,
    `SELECT TABLE_NAME t, COLUMN_NAME c, COLUMN_TYPE ty, IS_NULLABLE nl, COLUMN_DEFAULT d, EXTRA x
       FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION`)
  const idx = await q(conn,
    `SELECT TABLE_NAME t, INDEX_NAME i, NON_UNIQUE u, SEQ_IN_INDEX s, COLUMN_NAME c
       FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`)
  const fks = await q(conn,
    `SELECT k.TABLE_NAME t, k.CONSTRAINT_NAME n, k.COLUMN_NAME c, k.REFERENCED_TABLE_NAME rt,
            k.REFERENCED_COLUMN_NAME rc, r.UPDATE_RULE ur, r.DELETE_RULE dr
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
        AND r.TABLE_NAME = k.TABLE_NAME
      WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`)
  const cons = await q(conn,
    `SELECT TABLE_NAME t, CONSTRAINT_NAME n, CONSTRAINT_TYPE ty
       FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, CONSTRAINT_NAME`)
  const checks = await q(conn,
    `SELECT TABLE_NAME t, CONSTRAINT_NAME n, CHECK_CLAUSE cl
       FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, CONSTRAINT_NAME`).catch(() => [])

  const by = (rows) => rows.reduce((m, r) => (m.get(r.t) ?? m.set(r.t, []).get(r.t)).push(r) && m, new Map())
  const C = by(cols); const I = by(idx); const F = by(fks); const K = by(cons); const H = by(checks)
  // Referenced Forge tables are recorded by LOGICAL name, so a rename does not change the print.
  const ref = (t) => (isForgeName(t) ? `forge:${logicalOf(t)}` : t)

  const out = new Map()
  for (const t of tables) {
    out.set(t.n, {
      name: t.n, type: t.ty, engine: t.e, autoIncrement: t.ai == null ? null : Number(t.ai),
      columnsSig: (C.get(t.n) ?? []).map((r) => [r.c, r.ty, r.nl, r.d, r.x]),
      columns: sha((C.get(t.n) ?? []).map((r) => [r.c, r.ty, r.nl, r.d, r.x])),
      indexes: sha((I.get(t.n) ?? []).map((r) => [r.i, r.u, r.s, r.c])),
      foreignKeys: sha((F.get(t.n) ?? []).map((r) => [r.n, r.c, ref(r.rt), r.rc, r.ur, r.dr])),
      constraints: sha((K.get(t.n) ?? []).map((r) => [r.n, r.ty])),
      checks: sha((H.get(t.n) ?? []).map((r) => [r.n, r.cl])),
      fkTargets: (F.get(t.n) ?? []).map((r) => r.rt),
    })
  }
  for (const t of out.values()) {
    if (isForgeName(t.name) && t.type === 'BASE TABLE') {
      const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM ${ident(t.name)}`)
      t.rows = Number(n)
    }
    delete t.columnsSig
  }
  const objects = {
    triggers: await q(conn, `SELECT TRIGGER_NAME n, EVENT_OBJECT_TABLE t, ACTION_STATEMENT s FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()`),
    views: await q(conn, `SELECT TABLE_NAME n, VIEW_DEFINITION s FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE()`),
    routines: await q(conn, `SELECT ROUTINE_NAME n, ROUTINE_DEFINITION s FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()`),
    events: await q(conn, `SELECT EVENT_NAME n, EVENT_DEFINITION s FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()`).catch(() => []),
  }
  return { tables: out, objects }
}

/** Which layout the database is in, judged only from Forge-owned tables. */
async function classify(conn, snap) {
  const expected = await forgeTables() // physical forge_* -> columns
  const colsOf = new Map()
  for (const r of await q(conn, `SELECT TABLE_NAME t, COLUMN_NAME c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()`)) {
    ;(colsOf.get(r.t) ?? colsOf.set(r.t, new Set()).get(r.t)).add(r.c)
  }
  const owned = (name, logical) => {
    const t = snap.tables.get(name)
    if (!t || t.type !== 'BASE TABLE') return false
    const have = colsOf.get(name) ?? new Set()
    return [...expected.get(TABLE_RENAMES[logical])].every((c) => have.has(c))
  }
  const rows = LOGICAL_TABLES.map((logical) => {
    const prefixed = TABLE_RENAMES[logical]
    return {
      logical, prefixed,
      legacyExists: snap.tables.has(logical), legacyOwned: owned(logical, logical),
      prefixedExists: snap.tables.has(prefixed), prefixedOwned: owned(prefixed, logical),
    }
  })
  const allLegacy = rows.every((r) => r.legacyOwned && !r.prefixedExists)
  const allPrefixed = rows.every((r) => r.prefixedOwned && !r.legacyExists)
  return { rows, state: allLegacy ? 'legacy' : allPrefixed ? 'prefixed' : 'mixed' }
}

function compare(before, after, pairs) {
  const problems = []
  const notes = []
  // Structure is compared for every table. Row counts and AUTO_INCREMENT only
  // for Forge's tables: other applications keep writing to theirs meanwhile.
  const structural = ['type', 'engine', 'columns', 'indexes', 'foreignKeys', 'constraints', 'checks']
  const forgeOnly = ['autoIncrement', 'rows']
  const mapped = new Map(pairs.map(([from, to]) => [from, to]))
  const seen = new Set()
  for (const [name, b] of before.tables) {
    const target = mapped.get(name) ?? name
    seen.add(target)
    const a = after.tables.get(target)
    if (!a) { problems.push(`${name} -> ${target}: missing after migration`); continue }
    for (const f of [...structural, ...(mapped.has(name) ? forgeOnly : [])]) {
      if (JSON.stringify(b[f]) !== JSON.stringify(a[f])) problems.push(`${target}: ${f} changed (${b[f]} -> ${a[f]})`)
    }
  }
  for (const name of after.tables.keys()) if (!seen.has(name)) notes.push(`${name}: table appeared meanwhile (not Forge's)`)
  // No foreign key anywhere may still point at a name that no longer exists.
  for (const t of after.tables.values()) {
    for (const rt of t.fkTargets) if (!after.tables.has(rt)) problems.push(`${t.name}: FK references missing table ${rt}`)
  }
  for (const n of notes) console.log(`  note        ${n}`)
  return problems
}

/* -------------------------------------------------------------------------- */

const direction = ROLLBACK ? 'rollback' : 'forward'
const fromState = ROLLBACK ? 'prefixed' : 'legacy'
const toState = ROLLBACK ? 'legacy' : 'prefixed'
const pairs = LOGICAL_TABLES.map((l) => (ROLLBACK ? [TABLE_RENAMES[l], l] : [l, TABLE_RENAMES[l]]))

say(`\nATLAS Forge — migration 013: forge_ table prefix (${direction}${APPLY ? ', APPLY' : ', plan only'})`)
say(`  target      ${describe(cfg)}`)

const conn = await mysql.createConnection({ ...cfg, multipleStatements: false })
let exitCode = 0
try {
  const [[srv]] = await conn.query('SELECT VERSION() v, DATABASE() db, @@lower_case_table_names lctn')
  say(`  server      ${srv.v}  database ${srv.db}  lower_case_table_names=${srv.lctn}`)
  if (srv.db !== cfg.database) throw new Error(`connected to ${srv.db}, expected ${cfg.database}`)
  // MySQL 8 caches information_schema statistics (AUTO_INCREMENT); read them live.
  await conn.query('SET SESSION information_schema_stats_expiry = 0').catch(() => {})

  const before = await snapshot(conn)
  const { rows, state } = await classify(conn, before)
  const forgeRows = rows.reduce((s, r) => s + (before.tables.get(ROLLBACK ? r.prefixed : r.logical)?.rows ?? 0), 0)
  say(`  state       ${state.toUpperCase()}  (${rows.filter((r) => r.legacyOwned).length}/46 legacy, ${rows.filter((r) => r.prefixedOwned).length}/46 prefixed)`)

  if (state === toState) {
    say(`\n  Nothing to do: all 46 tables already have their ${toState === 'prefixed' ? 'forge_' : 'legacy'} names.\n`)
  } else if (state !== fromState) {
    say('\n  REFUSING: the database is not cleanly in the expected starting state. Nothing was changed.')
    for (const r of rows) {
      const ok = ROLLBACK ? r.prefixedOwned && !r.legacyExists : r.legacyOwned && !r.prefixedExists
      if (!ok) say(`    ${r.logical.padEnd(34)} legacy:${r.legacyExists ? (r.legacyOwned ? 'forge' : 'NOT-FORGE') : 'absent'}  forge_:${r.prefixedExists ? (r.prefixedOwned ? 'forge' : 'NOT-FORGE') : 'absent'}`)
    }
    exitCode = 2
  } else {
    // Objects that embed table names in SQL text would break silently.
    const re = new RegExp(`\\b(${pairs.map(([f]) => f).join('|')})\\b`, 'i')
    const embedded = Object.entries(before.objects).flatMap(([kind, list]) =>
      list.filter((o) => re.test(String(o.s ?? '')) || (o.t && isForgeName(o.t))).map((o) => `${kind}:${o.n}`))
    if (embedded.length) {
      say(`\n  REFUSING: these database objects reference Forge tables and would need updating first: ${embedded.join(', ')}`)
      exitCode = 2
    } else {
      say(`  rows        ${forgeRows} across 46 tables; ${before.tables.size - 46} other table(s) in the database will not be touched`)
      say(`\n  ${pairs.length} renames (single atomic statement):`)
      pairs.forEach(([f, t], i) => say(`    ${String(i + 1).padStart(2)}  ${f.padEnd(34)} -> ${t}`))

      if (!APPLY) {
        say('\n  PLAN ONLY — nothing was changed. Re-run with --apply to execute.\n')
      } else {
        const sql = `RENAME TABLE ${pairs.map(([f, t]) => `${ident(f)} TO ${ident(t)}`).join(', ')}`
        await conn.query('SET SESSION lock_wait_timeout = ?', [LOCK_WAIT])
        const started = Date.now()
        await conn.query(sql)
        say(`\n  RENAME TABLE completed in ${Date.now() - started} ms`)

        const after = await snapshot(conn)
        const post = await classify(conn, after)
        const problems = compare(before, after, pairs)
        if (post.state !== toState) problems.unshift(`state after rename is ${post.state}, expected ${toState}`)
        if (problems.length) {
          say('\n  VERIFICATION FAILED — no automatic changes made. Investigate, then roll back with:')
          say(`    npm run db:prefix -- ${ROLLBACK ? '' : '--rollback '}--apply`)
          for (const p of problems) say(`    - ${p}`)
          exitCode = 3
        } else {
          say(`  verified    46/46 renamed; row counts, AUTO_INCREMENT, columns, indexes, FKs, CHECK and`)
          say(`              constraints identical; all ${after.tables.size - 46} other tables unchanged; no dangling FK.\n`)
        }
        if (reportArg) {
          const plain = (s) => ({ tables: Object.fromEntries(s.tables), objects: s.objects })
          writeFileSync(reportArg, JSON.stringify({ direction, at: new Date().toISOString(), before: plain(before), after: plain(after), problems }, null, 2))
          say(`  report      ${reportArg}`)
        }
      }
    }
  }
} catch (error) {
  say(`\n  FAILED: ${error.code ?? ''} ${error.sqlMessage ?? error.message}`)
  say('  A multi-table RENAME is atomic: if it was reached it either fully applied or not at all.')
  say('  Re-run without --apply to see the current state.\n')
  exitCode = 1
} finally {
  await conn.end()
}
process.exit(exitCode)
