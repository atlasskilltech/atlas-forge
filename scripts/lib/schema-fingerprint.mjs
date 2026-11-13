/**
 * Structural schema fingerprinting for ATLAS Forge (read-only).
 *
 * Used by the baseline command to prove the LIVE forge_ schema structurally
 * matches the expected final schema — not just that column NAMES exist, but
 * their types, nullability, defaults, keys, indexes, foreign keys and CHECK
 * constraints. The "expected" fingerprint is built by applying database/schema.sql
 * to a throwaway LOCAL scratch database and snapshotting it (so the expectation
 * is derived from the committed SQL, never from the live server being checked),
 * or loaded from a committed JSON artifact for the production path.
 *
 * Everything here is information_schema reads plus, for the expected side, DDL
 * against a scratch database the caller owns. Never touches application tables.
 */
import mysql from 'mysql2/promise'
import { TABLE_RENAMES } from '../../src/lib/queries/tables.mjs'

const PREFIXED = new Set(Object.values(TABLE_RENAMES))

/** Read-only structural snapshot of every forge_ table in the connected DB. */
export async function snapshotForge(conn) {
  const q = async (sql, p = []) => (await conn.query(sql, p))[0]
  const all = await q(
    `SELECT TABLE_NAME n FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`)
  const names = all.map((r) => r.n)
  const forge = names.filter((n) => PREFIXED.has(n))

  const cols = await q(
    `SELECT TABLE_NAME t, COLUMN_NAME c, COLUMN_TYPE ty, IS_NULLABLE nl, COLUMN_DEFAULT d, EXTRA x, ORDINAL_POSITION p
       FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION`)
  const idx = await q(
    `SELECT TABLE_NAME t, INDEX_NAME i, NON_UNIQUE u, SEQ_IN_INDEX s, COLUMN_NAME c
       FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`)
  const fks = await q(
    `SELECT k.TABLE_NAME t, k.CONSTRAINT_NAME n, k.COLUMN_NAME c, k.REFERENCED_TABLE_NAME rt,
            k.REFERENCED_COLUMN_NAME rc, r.UPDATE_RULE ur, r.DELETE_RULE dr
       FROM information_schema.KEY_COLUMN_USAGE k
       JOIN information_schema.REFERENTIAL_CONSTRAINTS r
         ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
        AND r.TABLE_NAME = k.TABLE_NAME
      WHERE k.TABLE_SCHEMA = DATABASE() AND k.REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY k.TABLE_NAME, k.CONSTRAINT_NAME, k.ORDINAL_POSITION`)
  const checks = await q(
    `SELECT TABLE_NAME t, CONSTRAINT_NAME n, CHECK_CLAUSE cl
       FROM information_schema.CHECK_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, CONSTRAINT_NAME`).catch(() => [])

  const group = (rows, key = (r) => r.t) => {
    const m = new Map()
    for (const r of rows) { const k = key(r); if (!m.has(k)) m.set(k, []); m.get(k).push(r) }
    return m
  }
  const C = group(cols); const I = group(idx); const F = group(fks); const H = group(checks)

  const out = {}
  for (const name of forge) {
    const columns = (C.get(name) ?? []).map((r) => ({
      name: r.c, type: String(r.ty).toLowerCase(), nullable: r.nl === 'YES',
      default: r.d, extra: String(r.x || '').toLowerCase(),
    }))
    // Index -> ordered column list + uniqueness.
    const byIndex = new Map()
    for (const r of I.get(name) ?? []) {
      if (!byIndex.has(r.i)) byIndex.set(r.i, { name: r.i, unique: Number(r.u) === 0, cols: [] })
      byIndex.get(r.i).cols.push(r.c)
    }
    const indexes = [...byIndex.values()].sort((a, b) => a.name.localeCompare(b.name))
    const foreignKeys = (F.get(name) ?? []).map((r) => ({
      name: r.n, col: r.c, refTable: r.rt, refCol: r.rc, onUpdate: r.ur, onDelete: r.dr,
    })).sort((a, b) => a.name.localeCompare(b.name))
    const checkList = (H.get(name) ?? []).map((r) => ({ name: r.n, clause: String(r.cl) }))
      .sort((a, b) => a.name.localeCompare(b.name))
    out[name] = { columns, indexes, foreignKeys, checks: checkList }
  }
  return { tables: out, forgeTableNames: forge.sort(), allTableNames: names.sort() }
}

/** Human-readable differences between an expected and an actual snapshot. */
export function diffForge(expected, actual) {
  const problems = []
  const expNames = new Set(Object.keys(expected.tables))
  const actNames = new Set(Object.keys(actual.tables))
  for (const n of expNames) if (!actNames.has(n)) problems.push(`missing forge_ table: ${n}`)
  for (const n of actNames) if (!expNames.has(n)) problems.push(`unexpected forge_ table present: ${n}`)

  for (const n of expNames) {
    if (!actNames.has(n)) continue
    const e = expected.tables[n]; const a = actual.tables[n]
    const byName = (arr) => new Map(arr.map((x) => [x.name, x]))

    const ec = byName(e.columns); const ac = byName(a.columns)
    for (const [col, ecd] of ec) {
      const acd = ac.get(col)
      if (!acd) { problems.push(`${n}.${col}: column missing`); continue }
      if (ecd.type !== acd.type) problems.push(`${n}.${col}: type ${acd.type} ≠ expected ${ecd.type}`)
      if (ecd.nullable !== acd.nullable) problems.push(`${n}.${col}: nullability differs (expected ${ecd.nullable ? 'NULL' : 'NOT NULL'})`)
    }
    for (const col of ac.keys()) if (!ec.has(col)) problems.push(`${n}.${col}: unexpected column`)

    const sig = (x) => JSON.stringify(x)
    const eIdx = new Map(e.indexes.map((x) => [x.name, x]))
    const aIdx = new Map(a.indexes.map((x) => [x.name, x]))
    for (const [k, v] of eIdx) {
      if (!aIdx.has(k)) { problems.push(`${n}: index ${k} missing`); continue }
      if (sig(v) !== sig(aIdx.get(k))) problems.push(`${n}: index ${k} differs`)
    }
    for (const k of aIdx.keys()) if (!eIdx.has(k)) problems.push(`${n}: unexpected index ${k}`)

    const eFk = new Map(e.foreignKeys.map((x) => [x.name, x]))
    const aFk = new Map(a.foreignKeys.map((x) => [x.name, x]))
    for (const [k, v] of eFk) {
      if (!aFk.has(k)) { problems.push(`${n}: foreign key ${k} missing`); continue }
      if (sig(v) !== sig(aFk.get(k))) problems.push(`${n}: foreign key ${k} differs`)
    }
    for (const k of aFk.keys()) if (!eFk.has(k)) problems.push(`${n}: unexpected foreign key ${k}`)

    const eCk = new Map(e.checks.map((x) => [x.name, x.clause]))
    const aCk = new Map(a.checks.map((x) => [x.name, x.clause]))
    for (const k of eCk.keys()) if (!aCk.has(k)) problems.push(`${n}: CHECK ${k} missing`)
  }
  return problems
}

/* Errors that just mean "this structure/row already exists" — expected when the
 * baseline migrations are replayed on top of schema.sql (which already folds most
 * of them in). Anything else is a real problem and is rethrown. */
const ALREADY_PRESENT = new Set([
  'ER_TABLE_EXISTS_ERROR', 'ER_DUP_FIELDNAME', 'ER_DUP_KEYNAME', 'ER_FK_DUP_NAME',
  'ER_DUP_CONSTRAINT_NAME', 'ER_DUP_ENTRY', 'ER_CANT_CREATE_TABLE',
])

async function applyLenient(conn, statements) {
  for (const sql of statements) {
    // Structure only: skip seed/data (INSERT/UPDATE/…) and session statements.
    if (!/^\s*(CREATE|ALTER)\b/i.test(sql)) continue
    try { await conn.query(sql) } catch (e) {
      if (!ALREADY_PRESENT.has(e.code)) throw e
    }
  }
}

/**
 * Build the EXPECTED structure by applying schema.sql — plus the baseline
 * migrations (001–012), which add tables/columns schema.sql has not folded in
 * (e.g. forge_registration_requests) — to a throwaway scratch database on the
 * SAME local server, then dropping it. `migrationStatements` is an ordered flat
 * array of individual SQL statements, applied duplicate-tolerantly so replaying
 * them over schema.sql is safe. Local only (it creates a database).
 */
export async function buildExpectedFromSchemaSql(baseCfg, schemaSql, scratchName, migrationStatements = []) {
  const root = await mysql.createConnection({ ...baseCfg, database: undefined, multipleStatements: true })
  try {
    await root.query(`DROP DATABASE IF EXISTS \`${scratchName}\``)
    await root.query(`CREATE DATABASE \`${scratchName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    const scratch = await mysql.createConnection({ ...baseCfg, database: scratchName, multipleStatements: true })
    try {
      await scratch.query(schemaSql)
      await applyLenient(scratch, migrationStatements)
      return await snapshotForge(scratch)
    } finally {
      await scratch.end()
    }
  } finally {
    await root.query(`DROP DATABASE IF EXISTS \`${scratchName}\``).catch(() => {})
    await root.end()
  }
}
