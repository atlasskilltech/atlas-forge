/**
 * READ-ONLY pre-migration investigation for the `forge_` table prefix.
 *
 *   node --env-file=.env scripts/investigate-prefix.mjs [--json=<file>]
 *
 * Runs inside a READ ONLY transaction (the server rejects any write) and
 * reports, for the database named by DB_NAME:
 *
 *   - which of the 46 Forge tables exist under their legacy (unprefixed) and
 *     prefixed (`forge_`) names, and whether any `forge_*` target already exists
 *   - for every Forge table: exact row count, AUTO_INCREMENT, engine, collation
 *     and sha256 fingerprints of its columns, indexes and foreign keys
 *   - whether each table really is Forge's (all Forge columns present)
 *   - every foreign key between Forge and non-Forge tables (either direction)
 *   - FK / CHECK constraint names and any duplicates across the database
 *   - triggers, views, stored routines and events, and whether any of them
 *     mention a Forge table name
 *   - the other applications' tables, grouped by prefix, with structural
 *     fingerprints (to prove later that they were not changed)
 *
 * Prints no credentials. With --json, also writes the full report to a file.
 */
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import mysql from 'mysql2/promise'
import { dbEnv, describe, forgeTables } from './lib/forge-db.mjs'
import { LOGICAL_TABLES, TABLE_PREFIX, TABLE_RENAMES } from '../src/lib/queries/tables.mjs'

const jsonArg = process.argv.find((a) => a.startsWith('--json='))
const cfg = dbEnv()
const sha = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16)
const out = (...a) => console.log(...a)

const conn = await mysql.createConnection({ ...cfg, multipleStatements: false })
await conn.query('SET SESSION TRANSACTION READ ONLY')
await conn.query('START TRANSACTION WITH CONSISTENT SNAPSHOT, READ ONLY')

const q = async (sql, params = []) => (await conn.query(sql, params))[0]

const [server] = await q(
  `SELECT VERSION() AS version, DATABASE() AS db, CURRENT_USER() AS account,
          @@lower_case_table_names AS lctn, @@foreign_key_checks AS fkc`
)

/* --------------------------- inventory ------------------------------------ */
const allTables = await q(
  `SELECT TABLE_NAME AS name, TABLE_TYPE AS type, ENGINE AS engine,
          TABLE_COLLATION AS collation, AUTO_INCREMENT AS autoInc, TABLE_ROWS AS approxRows
     FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME`
)
const byName = new Map(allTables.map((t) => [t.name, t]))
const legacyNames = new Set(LOGICAL_TABLES)
const prefixedNames = new Set(Object.values(TABLE_RENAMES))

const columns = await q(
  `SELECT TABLE_NAME t, COLUMN_NAME c, COLUMN_TYPE ty, IS_NULLABLE n, COLUMN_DEFAULT d, EXTRA e
     FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, ORDINAL_POSITION`
)
const indexes = await q(
  `SELECT TABLE_NAME t, INDEX_NAME i, NON_UNIQUE u, SEQ_IN_INDEX s, COLUMN_NAME c
     FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`
)
const fks = await q(
  `SELECT k.TABLE_NAME t, k.CONSTRAINT_NAME n, k.COLUMN_NAME c,
          k.REFERENCED_TABLE_NAME rt, k.REFERENCED_COLUMN_NAME rc,
          r.UPDATE_RULE ur, r.DELETE_RULE dr
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.REFERENTIAL_CONSTRAINTS r
       ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
      AND r.TABLE_NAME = k.TABLE_NAME
    WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`
)
const constraints = await q(
  `SELECT TABLE_NAME t, CONSTRAINT_NAME n, CONSTRAINT_TYPE ty
     FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()`
)
const group = (rows) => {
  const m = new Map()
  for (const r of rows) {
    if (!m.has(r.t)) m.set(r.t, [])
    m.get(r.t).push(r)
  }
  return m
}
const colsBy = group(columns)
const idxBy = group(indexes)
const fkBy = group(fks)
const conBy = group(constraints)

// Forge's expected columns per logical table (from schema.sql + migrations).
const expected = new Map()
for (const [name, cols] of await forgeTables()) {
  expected.set(name.startsWith(TABLE_PREFIX) ? name.slice(TABLE_PREFIX.length) : name, cols)
}

// A table's identity with its own name blanked, so a renamed copy fingerprints the same.
const structure = (physical, logical) => {
  const strip = (s) => (s === physical ? '<self>' : s)
  return {
    columns: sha((colsBy.get(physical) ?? []).map((r) => [r.c, r.ty, r.n, r.d, r.e])),
    indexes: sha((idxBy.get(physical) ?? []).map((r) => [r.i, r.u, r.s, r.c])),
    foreignKeys: sha((fkBy.get(physical) ?? []).map((r) => [
      r.n, r.c, legacyNames.has(r.rt) || prefixedNames.has(r.rt) ? `forge:${strip(r.rt).replace(TABLE_PREFIX, '')}` : r.rt,
      r.rc, r.ur, r.dr,
    ])),
    constraints: sha((conBy.get(physical) ?? []).map((r) => [r.n, r.ty]).sort()),
    logical,
  }
}

/* ---------------------------- Forge tables -------------------------------- */
const forge = []
for (const logical of LOGICAL_TABLES) {
  const prefixed = TABLE_RENAMES[logical]
  const legacy = byName.get(logical)
  const target = byName.get(prefixed)
  const physical = legacy ? logical : target ? prefixed : null
  const row = { logical, legacyExists: Boolean(legacy), prefixedExists: Boolean(target), physical }
  if (physical) {
    const t = byName.get(physical)
    const have = new Set((colsBy.get(physical) ?? []).map((r) => r.c))
    const lacking = [...(expected.get(logical) ?? [])].filter((c) => !have.has(c))
    const [[{ n }]] = await conn.query(`SELECT COUNT(*) AS n FROM \`${physical}\``)
    Object.assign(row, {
      type: t.type, engine: t.engine, collation: t.collation, autoIncrement: t.autoInc,
      rows: Number(n), isForge: lacking.length === 0 && t.type === 'BASE TABLE', lacking,
      fingerprint: structure(physical, logical),
    })
  }
  forge.push(row)
}

/* -------------------------- cross-app links ------------------------------- */
const isForgeName = (n) => legacyNames.has(n) || prefixedNames.has(n)
const crossFks = fks.filter((r) => isForgeName(r.t) !== isForgeName(r.rt))

const fkNameCounts = new Map()
for (const c of constraints.filter((c) => c.ty === 'FOREIGN KEY' || c.ty === 'CHECK')) {
  fkNameCounts.set(`${c.ty}:${c.n}`, (fkNameCounts.get(`${c.ty}:${c.n}`) ?? 0) + 1)
}
const duplicateConstraintNames = [...fkNameCounts].filter(([k, v]) => v > 1 && k.startsWith('FOREIGN KEY'))
const forgeConstraintNames = constraints
  .filter((c) => isForgeName(c.t) && (c.ty === 'FOREIGN KEY' || c.ty === 'CHECK'))
  .map((c) => `${c.ty === 'CHECK' ? 'CHECK' : 'FK'} ${c.n}`)

/* ----------------------- objects that embed SQL --------------------------- */
const mentionRe = new RegExp(`\\b(${LOGICAL_TABLES.join('|')})\\b`, 'i')
const triggers = await q(
  `SELECT TRIGGER_NAME n, EVENT_OBJECT_TABLE t, ACTION_STATEMENT s
     FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE()`
)
const views = await q(
  `SELECT TABLE_NAME n, VIEW_DEFINITION s FROM information_schema.VIEWS WHERE TABLE_SCHEMA = DATABASE()`
)
const routines = await q(
  `SELECT ROUTINE_NAME n, ROUTINE_TYPE ty, ROUTINE_DEFINITION s
     FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE()`
)
let events = []
try {
  events = await q(
    `SELECT EVENT_NAME n, STATUS st, EVENT_DEFINITION s FROM information_schema.EVENTS WHERE EVENT_SCHEMA = DATABASE()`
  )
} catch (error) {
  events = [{ n: `could not list (${error.code})` }]
}
const mentions = (list, kind) =>
  list.map((o) => ({
    kind, name: o.n, table: o.t ?? null,
    onForgeTable: o.t ? isForgeName(o.t) : false,
    mentionsForgeName: mentionRe.test(String(o.s ?? '')) || (o.t ? isForgeName(o.t) : false),
  }))
const sqlObjects = [
  ...mentions(triggers, 'TRIGGER'), ...mentions(views, 'VIEW'),
  ...mentions(routines, 'ROUTINE'), ...mentions(events, 'EVENT'),
]

/* ---------------------------- other apps ---------------------------------- */
const others = allTables.filter((t) => !isForgeName(t.name))
const prefixOf = (n) => (n.includes('_') ? `${n.split('_')[0]}_` : '(no prefix)')
const otherGroups = {}
for (const t of others) (otherGroups[prefixOf(t.name)] ??= []).push(t.name)
const otherFingerprints = Object.fromEntries(
  others.map((t) => [t.name, { type: t.type, ...structure(t.name, null), logical: undefined }])
)

await conn.query('COMMIT')
await conn.end()

/* ------------------------------ report ------------------------------------ */
const legacyCount = forge.filter((r) => r.legacyExists).length
const prefixedCount = forge.filter((r) => r.prefixedExists).length
const notForge = forge.filter((r) => r.physical && !r.isForge)
const anyForgeLike = allTables.filter((t) => t.name.startsWith(TABLE_PREFIX) && !prefixedNames.has(t.name))

out('\nATLAS Forge — read-only prefix-migration investigation')
out(`  target             ${describe(cfg)}`)
out(`  server             ${server.version}  db=${server.db}  as ${server.account}`)
out(`  lower_case_table_names=${server.lctn}  foreign_key_checks=${server.fkc}`)
out(`  tables in database ${allTables.length}  (Forge legacy ${legacyCount}/46, Forge prefixed ${prefixedCount}/46, other ${others.length})`)
out(`  state              ${legacyCount === 46 && prefixedCount === 0 ? 'LEGACY — all 46 unprefixed, no forge_* targets (ready to migrate)'
  : prefixedCount === 46 && legacyCount === 0 ? 'MIGRATED — all 46 prefixed'
  : 'MIXED/INCOMPLETE — see table below'}`)
out(`  forge_* names not in the 46-table map: ${anyForgeLike.length ? anyForgeLike.map((t) => t.name).join(', ') : 'none'}`)
out(`  tables not matching Forge's structure: ${notForge.length ? notForge.map((r) => `${r.physical} (lacks ${r.lacking.join(', ')})`).join('; ') : 'none — all present tables are Forge\'s'}`)

out('\n  #  legacy name -> new name                                      rows   auto_inc  engine  cols/idx/fk fingerprint')
forge.forEach((r, i) => {
  const name = `${r.logical} -> ${TABLE_RENAMES[r.logical]}`
  const where = r.legacyExists && r.prefixedExists ? 'BOTH!' : r.legacyExists ? '' : r.prefixedExists ? '(already prefixed)' : 'MISSING'
  out(`  ${String(i + 1).padStart(2)} ${name.padEnd(64)} ${String(r.rows ?? '-').padStart(6)} ${String(r.autoIncrement ?? '-').padStart(9)}  ${String(r.engine ?? '-').padEnd(6)}  ${r.fingerprint ? `${r.fingerprint.columns}/${r.fingerprint.indexes}/${r.fingerprint.foreignKeys}` : ''} ${where}`)
})
out(`  total Forge rows   ${forge.reduce((s, r) => s + (r.rows ?? 0), 0)}`)

out(`\n  foreign keys between Forge and non-Forge tables: ${crossFks.length ? '' : 'none'}`)
for (const r of crossFks) out(`    ${r.t}.${r.c} -> ${r.rt}.${r.rc} (${r.n})`)
out(`  Forge FK + CHECK constraints: ${forgeConstraintNames.length}`)
out(`  duplicate FK constraint names in database: ${duplicateConstraintNames.length ? duplicateConstraintNames.map(([k]) => k).join(', ') : 'none'}`)
out(`  triggers ${triggers.length}, views ${views.length}, routines ${routines.length}, events ${events.length}`)
for (const o of sqlObjects) out(`    ${o.kind} ${o.name}${o.table ? ` on ${o.table}` : ''}${o.mentionsForgeName ? '  <-- references a Forge table' : ''}`)
out(`\n  other applications' tables by prefix:`)
for (const [p, names] of Object.entries(otherGroups).sort()) out(`    ${p.padEnd(14)} ${names.length}: ${names.join(', ')}`)

if (jsonArg) {
  const file = jsonArg.slice('--json='.length)
  writeFileSync(file, JSON.stringify({
    takenAt: new Date().toISOString(), server, forge, crossFks, forgeConstraintNames,
    duplicateConstraintNames, sqlObjects, otherGroups, otherFingerprints,
  }, null, 2))
  out(`\n  full report written to ${file}`)
}
out('')
