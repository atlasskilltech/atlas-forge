/**
 * ATLAS Forge — general schema-migration core (pure logic + DB helpers).
 *
 * Adapted from the proven Atlas News runner (lib/news/db/migrate.js): immutable
 * checksummed history, a database-level lock, strict per-statement validation,
 * and ownership rules — tightened to ATLAS Forge's production-safety rules.
 *
 * SAFETY MODEL (enforced here):
 *   - ADDITIVE ONLY. A migration may only CREATE TABLE forge_*, CREATE INDEX on
 *     forge_*, or ALTER TABLE forge_* ADD … . No DROP/MODIFY/CHANGE/RENAME/
 *     TRUNCATE/LIKE/data statement ever (those need a separate manual process).
 *   - forge_ NAMESPACE ONLY (every table named, including REFERENCES targets).
 *   - IDEMPOTENT. Managed statements must use IF NOT EXISTS, so a half-applied
 *     migration can be safely re-run (we never auto-DROP to clean up).
 *   - BACKWARD-COMPATIBLE BY DEFAULT. The automatic (while-serving) path accepts
 *     only ONLINE-SAFE, backward-compatible changes: new tables, nullable or
 *     DEFAULTed columns, and non-unique secondary indexes. A NOT NULL column
 *     without a DEFAULT is refused outright (it breaks the previous release and
 *     fails on existing rows). UNIQUE / PRIMARY KEY / FOREIGN KEY / CHECK adds
 *     change write semantics and/or validate+lock existing rows, so they are
 *     "maintenance-window-only" and refused unless explicitly run with
 *     `maintenance: true` (which the deploy sets ONLY inside a window).
 *   - IMMUTABLE HISTORY (SHA-256 checksum per applied migration).
 *   - ONE RUNNER AT A TIME via GET_LOCK.
 *   - BOUNDED WAITS. The runner pins a short lock_wait_timeout + max_statement_time
 *     so a migration can never queue indefinitely behind live traffic.
 *   - `down` is NEVER run automatically; it is a manual, confirmed, backup-gated
 *     reverse, validated as the exact paired inverse of `up`.
 *
 * All DB access goes through an injected adapter { query, exec } so the logic is
 * unit-testable without a server. Nothing here prints a credential.
 */
import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { TABLE_RENAMES } from '../../src/lib/queries/tables.mjs'

export const BOOKKEEPING_TABLE = 'forge_schema_migrations'
export const LOCK_NAME = 'forge_schema_migrate'

export const BOOKKEEPING_DDL = `CREATE TABLE IF NOT EXISTS ${BOOKKEEPING_TABLE} (
  id VARCHAR(100) NOT NULL,
  source ENUM('baseline','managed') NOT NULL DEFAULT 'managed',
  description VARCHAR(255) NOT NULL DEFAULT '',
  checksum CHAR(64) NOT NULL,
  applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

/** Default bounded waits for the migration session (seconds). */
export const DEFAULT_LOCK_WAIT = 10
export const DEFAULT_MAX_STATEMENT_TIME = 30

const FORGE_NAME = /^forge_[a-z0-9_]+$/
const ID = '`?([A-Za-z0-9_$]+)`?'

/** The 46 schema-owned forge_ tables. A managed migration may ADD to these but
 *  may never CREATE one (that would clobber a real table). New feature tables
 *  must use a fresh forge_ name. */
const BASELINE_TABLE_NAMES = new Set(Object.values(TABLE_RENAMES))

/* -------------------------------------------------------------------------- */
/* Statement parsing (pure)                                                   */
/* -------------------------------------------------------------------------- */

export function stripLiterals(sql) {
  return sql
    .replace(/'(?:[^'\\]|\\.|'')*'/g, "''")
    .replace(/"(?:[^"\\]|\\.|"")*"/g, '""')
}

export function stripComments(text) {
  let out = ''
  let i = 0
  let quote = null
  while (i < text.length) {
    const c = text[i]
    const d = text[i + 1]
    if (quote) {
      out += c
      if (c === '\\') { out += d ?? ''; i += 2; continue }
      if (c === quote) quote = null
      i += 1
      continue
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; out += c; i += 1; continue }
    if (c === '-' && d === '-') { while (i < text.length && text[i] !== '\n') i += 1; continue }
    if (c === '#') { while (i < text.length && text[i] !== '\n') i += 1; continue }
    if (c === '/' && d === '*') { i += 2; while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i += 1; i += 2; continue }
    out += c
    i += 1
  }
  return out
}

export function splitStatements(sqlText) {
  const text = stripComments(sqlText)
  const out = []
  let buf = ''
  let quote = null
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i]
    if (quote) {
      buf += c
      if (c === '\\') { buf += text[i + 1] ?? ''; i += 1; continue }
      if (c === quote) quote = null
      continue
    }
    if (c === "'" || c === '"' || c === '`') { quote = c; buf += c; continue }
    if (c === ';') { if (buf.trim()) out.push(buf.trim()); buf = ''; continue }
    buf += c
  }
  if (buf.trim()) out.push(buf.trim())
  return out
}

/** Split a comma list at top-level (paren depth 0), on already-stripped SQL. */
function splitTopLevel(s) {
  const parts = []
  let buf = ''
  let depth = 0
  for (const c of s) {
    if (c === '(') depth += 1
    else if (c === ')') depth = Math.max(0, depth - 1)
    if (c === ',' && depth === 0) { parts.push(buf.trim()); buf = ''; continue }
    buf += c
  }
  if (buf.trim()) parts.push(buf.trim())
  return parts
}

/* Keywords never valid in an ADDITIVE migration (scanned on literal-stripped SQL). */
const FORBIDDEN_UP = [
  /\bSELECT\b/i, /\bINSERT\b/i, /\bREPLACE\b/i, /\bDELETE\s+FROM\b/i,
  /\bUPDATE\s+`?[A-Za-z0-9_$]+`?\s+SET\b/i, /\bTRUNCATE\b/i, /\bRENAME\b/i,
  /\bLIKE\b/i, /\bUNION\b/i, /\bINTO\b/i, /\bLOAD\b/i, /\bHANDLER\b/i, /\bCALL\b/i,
  /\bPREPARE\b/i, /\bEXECUTE\b/i, /\bLOCK\b/i, /\bGRANT\b/i, /\bREVOKE\b/i,
  /\bTABLESPACE\b/i, /\bDISCARD\b/i, /\bIMPORT\b/i, /\bEXCHANGE\b/i,
  /\b(?:CREATE|ALTER|DROP)\s+(?:DATABASE|SCHEMA)\b/i, /\bTRIGGER\b/i,
  /\bPROCEDURE\b/i, /\bFUNCTION\b/i, /\bVIEW\b/i, /\bEVENT\b/i, /\bSERVER\b/i,
  /\bDROP\b/i, /\bPARTITION\b/i,
]

function assertForge(name) {
  if (!FORGE_NAME.test(name)) {
    throw new Error(`table "${name}" is outside the forge_ namespace (migrations may only touch forge_* tables)`)
  }
}

/** Foreign-table references in additive DDL: ONLY the REFERENCES target (H1 —
 *  deliberately NOT scanning TABLE/JOIN/FROM/INTO/ON, which falsely captured
 *  `ON DELETE`/`ON UPDATE` actions). */
function collectRefs(bare, first) {
  const refs = [first]
  for (const r of bare.matchAll(new RegExp(`\\bREFERENCES\\s+${ID}`, 'gi'))) refs.push(r[1])
  return [...new Set(refs)]
}

/** Classify one ALTER ... ADD clause (literal-stripped, starts with ADD). */
export function analyseAddClause(clause) {
  const c = clause.trim()
  if (!/^ADD\b/i.test(c)) return { type: 'invalid', reason: 'ALTER clause is not ADD' }
  const idempotent = /\bIF\s+NOT\s+EXISTS\b/i.test(c)
  // Remove IF NOT EXISTS (it may sit after ADD, after COLUMN, or after
  // CONSTRAINT <name>) before classifying the clause TYPE.
  let r = c.replace(/^ADD\s+/i, '').replace(/\bIF\s+NOT\s+EXISTS\b/gi, ' ').replace(/\s+/g, ' ').trim()
  const noCon = r.replace(/^CONSTRAINT\s+(?:`?[A-Za-z0-9_$]+`?\s+)?/i, '')
  if (/^PRIMARY\s+KEY\b/i.test(noCon)) return { type: 'primary', idempotent }
  if (/^UNIQUE\b/i.test(noCon)) return { type: 'unique', idempotent }
  if (/^FOREIGN\s+KEY\b/i.test(noCon)) return { type: 'foreign', idempotent }
  if (/^CHECK\b/i.test(noCon)) return { type: 'check', idempotent }
  if (/^(?:FULLTEXT\s+|SPATIAL\s+)?(?:INDEX|KEY)\b/i.test(r)) return { type: 'index', idempotent }
  // Otherwise a column.
  let col = r.replace(/^COLUMN\s+/i, '').replace(/^IF\s+NOT\s+EXISTS\s+/i, '')
  const m = col.match(new RegExp(`^${ID}`))
  const name = m ? m[1] : null
  const notNull = /\bNOT\s+NULL\b/i.test(col)
  const hasDefault = /\bDEFAULT\b/i.test(col) || /\bAUTO_INCREMENT\b/i.test(col)
  const generatedStored = /\bGENERATED\s+ALWAYS\b.*\bSTORED\b/i.test(col) || /\bAS\s*\(.*\)\s*STORED\b/i.test(col)
  return { type: 'column', name, notNull, hasDefault, generatedStored, idempotent }
}

/**
 * Parse one ADDITIVE `up` statement. Returns { kind, table, refs, unique?, clauses? }
 * or throws. Enforces: additive-only, forge_ namespace, idempotency (IF NOT
 * EXISTS), and no NOT NULL-without-DEFAULT column add.
 */
export function analyseUp(sql) {
  if (typeof sql !== 'string' || !sql.trim()) throw new Error('empty statement')
  const bare = stripLiterals(sql).trim()
  if (/--|#|\/\*/.test(bare)) throw new Error('comments are not allowed inside a statement')
  if (bare.includes(';')) throw new Error('only one statement per entry (no ";")')
  if (/[A-Za-z0-9_$`]\s*\.\s*[A-Za-z_$`]/.test(bare)) throw new Error('qualified (database.table) names are not allowed')

  let m
  if ((m = bare.match(new RegExp(`^CREATE\\s+TABLE\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${ID}\\s*\\(`, 'i')))) {
    if (!m[1]) throw new Error('managed CREATE TABLE must use IF NOT EXISTS (idempotent re-run)')
    const table = m[2]
    assertForge(table)
    for (const re of FORBIDDEN_UP) if (re.test(bare)) throw new Error(`forbidden keyword in CREATE TABLE: ${String(re)}`)
    const refs = collectRefs(bare, table)
    refs.forEach(assertForge)
    return { kind: 'create', table, refs }
  }

  if ((m = bare.match(new RegExp(`^CREATE\\s+(UNIQUE\\s+|FULLTEXT\\s+|SPATIAL\\s+)?INDEX\\s+(IF\\s+NOT\\s+EXISTS\\s+)?${ID}\\s+ON\\s+${ID}\\s*\\(`, 'i')))) {
    if (!m[2]) throw new Error('managed CREATE INDEX must use IF NOT EXISTS (idempotent re-run)')
    const table = m[4]
    assertForge(table)
    for (const re of FORBIDDEN_UP) if (re.test(bare)) throw new Error(`forbidden keyword in CREATE INDEX: ${String(re)}`)
    return { kind: 'create_index', table, unique: Boolean(m[1] && /UNIQUE/i.test(m[1])), indexName: m[3], refs: [table] }
  }

  if ((m = bare.match(new RegExp(`^ALTER\\s+TABLE\\s+${ID}\\s+(\\S[\\s\\S]*)$`, 'i')))) {
    const table = m[1]
    assertForge(table)
    const clauses = splitTopLevel(m[2]).map((raw) => ({ raw, info: analyseAddClause(raw) }))
    if (!clauses.length) throw new Error('ALTER TABLE with no action')
    for (const { raw, info } of clauses) {
      if (info.type === 'invalid') {
        throw new Error(`ALTER TABLE may only ADD in a migration (got: "${raw.slice(0, 48)}"). DROP/MODIFY/CHANGE/RENAME require the manual process.`)
      }
      // Idempotency: columns and indexes must be IF NOT EXISTS (PRIMARY KEY has no such form).
      if (!info.idempotent && info.type !== 'primary') {
        throw new Error(`ALTER ADD must use IF NOT EXISTS for idempotent re-run (got: "${raw.slice(0, 48)}")`)
      }
      // Never-allowed even in a maintenance window: NOT NULL column without a DEFAULT.
      if (info.type === 'column' && info.notNull && !info.hasDefault) {
        throw new Error(`ADD COLUMN ${info.name || ''} is NOT NULL without a DEFAULT — refused (fails on existing rows and breaks the previous release). Add a DEFAULT or backfill in a separate step.`)
      }
    }
    const refs = collectRefs(bare, table)
    refs.forEach(assertForge)
    return { kind: 'alter_add', table, clauses, refs }
  }

  throw new Error('only CREATE TABLE, CREATE INDEX and additive ALTER TABLE ... ADD are allowed in a migration')
}

/**
 * Classify a parsed `up` statement for online-safety and backward-compatibility.
 *   onlineSafe             — applies without blocking live traffic AND keeps the
 *                            previous release working (can run while serving).
 *   backwardCompatible     — the previous release keeps working after it.
 * UNIQUE/PRIMARY/FOREIGN/CHECK and STORED generated columns are neither.
 */
export function classifyUp(sql) {
  const a = analyseUp(sql)
  const reasons = []
  if (a.kind === 'create') return { kind: a.kind, onlineSafe: true, backwardCompatible: true, reasons }
  if (a.kind === 'create_index') {
    if (a.unique) reasons.push('CREATE UNIQUE INDEX changes write semantics and can fail on existing duplicates')
    return { kind: a.kind, onlineSafe: !a.unique, backwardCompatible: !a.unique, reasons }
  }
  // alter_add
  let onlineSafe = true
  let backwardCompatible = true
  for (const { info } of a.clauses) {
    if (info.type === 'unique') { onlineSafe = false; backwardCompatible = false; reasons.push('ADD UNIQUE changes write semantics / validates existing rows') }
    else if (info.type === 'primary') { onlineSafe = false; backwardCompatible = false; reasons.push('ADD PRIMARY KEY rebuilds the table') }
    else if (info.type === 'foreign') { onlineSafe = false; backwardCompatible = false; reasons.push('ADD FOREIGN KEY validates existing rows and changes write semantics') }
    else if (info.type === 'check') { onlineSafe = false; backwardCompatible = false; reasons.push('ADD CHECK changes write semantics') }
    else if (info.type === 'column' && info.generatedStored) { onlineSafe = false; reasons.push('STORED generated column rebuilds the table') }
    // nullable/defaulted columns and non-unique indexes are online-safe + compatible
  }
  return { kind: a.kind, onlineSafe, backwardCompatible, reasons }
}

/** Aggregate classification for a whole migration. */
export function classifyMigration(m) {
  const reasons = []
  let onlineSafe = true
  let backwardCompatible = true
  for (const sql of m.up || []) {
    const c = classifyUp(sql)
    if (!c.onlineSafe) onlineSafe = false
    if (!c.backwardCompatible) backwardCompatible = false
    for (const r of c.reasons) reasons.push(`${r}`)
  }
  return { onlineSafe, backwardCompatible, blocking: !onlineSafe, reasons: [...new Set(reasons)] }
}

/**
 * Parse one `down` statement (manual reverse only). Returns a canonical object
 * token for paired-inverse checking. forge_ namespace enforced.
 */
export function analyseDown(sql) {
  if (typeof sql !== 'string' || !sql.trim()) throw new Error('empty statement')
  const bare = stripLiterals(sql).trim()
  if (bare.includes(';')) throw new Error('only one statement per entry (no ";")')
  if (/[A-Za-z0-9_$`]\s*\.\s*[A-Za-z_$`]/.test(bare)) throw new Error('qualified (database.table) names are not allowed')
  for (const re of [/\bSELECT\b/i, /\bINSERT\b/i, /\bUPDATE\b/i, /\bDELETE\b/i, /\bTRUNCATE\b/i, /\bRENAME\b/i, /\bGRANT\b/i, /\bREVOKE\b/i, /\b(?:DATABASE|SCHEMA)\b/i]) {
    if (re.test(bare)) throw new Error(`forbidden keyword in down statement: ${String(re)}`)
  }
  let m
  if ((m = bare.match(new RegExp(`^DROP\\s+TABLE\\s+(?:IF\\s+EXISTS\\s+)?${ID}$`, 'i')))) {
    assertForge(m[1]); return { kind: 'drop_table', table: m[1], token: `table:${m[1]}` }
  }
  if ((m = bare.match(new RegExp(`^DROP\\s+INDEX\\s+(?:IF\\s+EXISTS\\s+)?${ID}\\s+ON\\s+${ID}$`, 'i')))) {
    assertForge(m[2]); return { kind: 'drop_index', table: m[2], name: m[1], token: `index:${m[2]}:${m[1]}` }
  }
  if ((m = bare.match(new RegExp(`^ALTER\\s+TABLE\\s+${ID}\\s+(\\S[\\s\\S]*)$`, 'i')))) {
    const table = m[1]; assertForge(table)
    const clauses = splitTopLevel(m[2])
    if (clauses.length !== 1) throw new Error('paired down ALTER must contain exactly one DROP clause')
    const clause = clauses[0]
    let d
    if ((d = clause.match(/^DROP\s+COLUMN\s+(?:IF\s+EXISTS\s+)?`?([A-Za-z0-9_$]+)`?$/i))) return { kind: 'drop_column', table, name: d[1], token: `col:${table}:${d[1]}` }
    if ((d = clause.match(/^DROP\s+(?:INDEX|KEY)\s+(?:IF\s+EXISTS\s+)?`?([A-Za-z0-9_$]+)`?$/i))) return { kind: 'drop_key', table, name: d[1], token: `index:${table}:${d[1]}` }
    throw new Error(`down ALTER may only DROP COLUMN or DROP INDEX/KEY (got: "${clause.slice(0, 48)}")`)
  }
  throw new Error('down statements may only DROP TABLE, DROP INDEX or ALTER TABLE ... DROP a forge_ table')
}

/** Canonical object token for an `up` statement, for paired-inverse checking. */
function upToken(sql) {
  const a = analyseUp(sql)
  if (a.kind === 'create') return `table:${a.table}`
  if (a.kind === 'create_index') return `index:${a.table}:${a.indexName}`
  // alter_add: paired migrations require exactly ONE add clause per statement
  if (a.clauses.length !== 1) throw new Error('a paired ALTER must contain exactly one ADD clause')
  const { raw, info } = a.clauses[0]
  if (info.type === 'column') return `col:${a.table}:${info.name}`
  const m = raw.match(/^ADD\s+(?:CONSTRAINT\s+(?:`?[A-Za-z0-9_$]+`?\s+)?)?(?:(?:UNIQUE|FULLTEXT|SPATIAL)\s+)?(?:INDEX|KEY)\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([A-Za-z0-9_$]+)`?/i)
  if (m) return `index:${a.table}:${m[1]}`
  throw new Error('this ADD cannot be paired automatically; provide a manual down')
}

/* -------------------------------------------------------------------------- */
/* Checksums and validation (pure)                                            */
/* -------------------------------------------------------------------------- */

const norm = (s) => String(s).replace(/\s+/g, ' ').trim()

export function checksum(mig) {
  if (mig.fingerprint !== undefined) {
    return createHash('sha256').update(`fingerprint:${mig.fingerprint}`).digest('hex')
  }
  const payload = { up: (mig.up || []).map(norm), down: (mig.down || []).map(norm) }
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex')
}

export function validateMigrations(migrations) {
  const ids = new Set()
  const createdSoFar = new Set()
  const created = new Map()
  for (const m of migrations) {
    if (!m || typeof m.id !== 'string' || !/^[0-9]{3,4}[a-z0-9_]*(?:_[a-z0-9_]+)?$/i.test(m.id) || ids.has(m.id)) {
      throw new Error(`bad or duplicate migration id: ${m?.id}`)
    }
    ids.add(m.id)
    const source = m.source || 'managed'
    if (source !== 'managed') { created.set(m.id, []); continue }

    if (!Array.isArray(m.up) || m.up.length === 0 || !Array.isArray(m.down)) {
      throw new Error(`${m.id}: up must be a non-empty array and down an array`)
    }
    const own = []
    for (const sql of m.up) {
      let a
      try { a = analyseUp(sql) } catch (e) { throw new Error(`${m.id} (up): ${e.message}`) }
      if (a.kind === 'create') {
        if (BASELINE_TABLE_NAMES.has(a.table)) throw new Error(`${m.id}: may not CREATE baseline table ${a.table} (owned by the 46-table schema); only ADD to it`)
        if (own.includes(a.table) || createdSoFar.has(a.table)) throw new Error(`${m.id}: creates ${a.table} which already exists in an earlier migration`)
        own.push(a.table)
      }
    }
    for (const sql of m.down) {
      try { analyseDown(sql) } catch (e) { throw new Error(`${m.id} (down): ${e.message}`) }
    }
    // A down must be the exact paired inverse of up (M2): down[i] reverses
    // up[n-1-i] on the same object. This is required whenever a down exists.
    if (m.down.length > 0) {
      if (!m.pairedDown) throw new Error(`${m.id}: a migration with a down must set pairedDown: true (the down is validated as the exact inverse of up)`)
      if (m.down.length !== m.up.length) throw new Error(`${m.id}: pairedDown needs as many down steps as up steps`)
      m.up.forEach((upSql, i) => {
        const want = upToken(upSql)
        const got = analyseDown(m.down[m.up.length - 1 - i]).token
        if (want !== got) throw new Error(`${m.id}: down step ${m.up.length - i} does not reverse up step ${i + 1} (expected ${want}, got ${got})`)
      })
      // down may only drop tables THIS migration creates.
      for (const sql of m.down) {
        const d = analyseDown(sql)
        if (d.kind === 'drop_table' && !own.includes(d.table)) {
          throw new Error(`${m.id} (down): may only DROP TABLE a table its own up creates, not ${d.table}`)
        }
      }
    }
    created.set(m.id, own)
    for (const t of own) createdSoFar.add(t)
  }
  return { created }
}

/* -------------------------------------------------------------------------- */
/* DB helpers (take an injected adapter { query, exec })                      */
/* -------------------------------------------------------------------------- */

export async function ensureBookkeeping(db) {
  await db.exec(BOOKKEEPING_DDL)
}

async function bookkeepingExists(db) {
  const rows = await db.query(
    `SELECT TABLE_NAME AS t FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [BOOKKEEPING_TABLE])
  return rows.length > 0
}

export async function readHistory(db) {
  if (!(await bookkeepingExists(db))) return new Map()
  const rows = await db.query(`SELECT id, source, checksum, applied_at FROM ${BOOKKEEPING_TABLE} ORDER BY id`)
  return new Map(rows.map((r) => [r.id, r]))
}

/** Bound how long any migration statement may wait for a lock or run (C2). */
export async function prepareSession(db, { lockWaitTimeout = DEFAULT_LOCK_WAIT, maxStatementTime = DEFAULT_MAX_STATEMENT_TIME, online = true } = {}) {
  const applied = {}
  try { await db.query('SET SESSION lock_wait_timeout = ?', [lockWaitTimeout]); applied.lockWaitTimeout = lockWaitTimeout } catch { /* older servers */ }
  try { await db.query('SET SESSION innodb_lock_wait_timeout = ?', [lockWaitTimeout]) } catch { /* ignore */ }
  if (maxStatementTime > 0) {
    try { await db.query('SET SESSION max_statement_time = ?', [maxStatementTime]); applied.maxStatementTime = maxStatementTime } catch { /* MySQL uses max_execution_time (ms) */ }
  }
  if (online) {
    // Fail fast instead of silently copying (and long-locking) a large table.
    try { await db.query("SET SESSION alter_algorithm = 'INPLACE'"); applied.alterAlgorithm = 'INPLACE' } catch { /* not on MySQL */ }
  }
  return applied
}

export async function withLock(db, fn, timeout = 10) {
  const [r] = await db.query('SELECT GET_LOCK(?, ?) AS ok', [LOCK_NAME, timeout])
  if (Number(r.ok) !== 1) throw new Error('another ATLAS Forge migration is running (lock not acquired)')
  try {
    return await fn()
  } finally {
    try { await db.query('SELECT RELEASE_LOCK(?)', [LOCK_NAME]) } catch { /* lock frees on disconnect anyway */ }
  }
}

async function existingTables(db) {
  const rows = await db.query(
    `SELECT TABLE_NAME AS t FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'`)
  return new Set(rows.map((r) => r.t))
}

export async function computeStatus(db, migrations) {
  const { created } = validateMigrations(migrations)
  const [info] = await db.query('SELECT DATABASE() AS db, VERSION() AS version')
  const history = await readHistory(db)
  const tables = await existingTables(db)
  const problems = []

  for (const m of migrations) {
    const h = history.get(m.id)
    if (h && h.checksum !== checksum(m)) problems.push(`applied migration ${m.id} has been edited (checksum mismatch)`)
  }
  for (const id of history.keys()) {
    if (!migrations.some((m) => m.id === id)) problems.push(`database records migration ${id} that this code does not define`)
  }

  const managed = migrations.filter((m) => (m.source || 'managed') === 'managed')
  const pending = managed.filter((m) => !history.has(m.id))
  for (const m of pending) {
    // CREATEs are `IF NOT EXISTS`, so a leftover from a half-applied run re-runs
    // harmlessly. Only flag a clash with a BASELINE table (which validation also
    // forbids creating) as a hard problem — never block an idempotent re-run.
    const clash = (created.get(m.id) || []).filter((t) => tables.has(t) && BASELINE_TABLE_NAMES.has(t))
    if (clash.length) problems.push(`pending migration ${m.id} would CREATE baseline table(s): ${clash.join(', ')}`)
  }

  const baseline = migrations.filter((m) => (m.source || 'managed') !== 'managed')
  const baselinePending = baseline.filter((m) => !history.has(m.id)).map((m) => m.id)

  return {
    database: info.db,
    serverVersion: info.version,
    applied: [...history.values()].map((h) => ({ id: h.id, source: h.source, appliedAt: h.applied_at })),
    pending: pending.map((m) => ({ id: m.id, ...classifyMigration(m) })),
    baselinePending,
    problems,
  }
}

/**
 * Apply pending MANAGED migrations, additively. Online-safe migrations only,
 * unless `maintenance: true` (which the deploy sets ONLY inside a window). Never
 * drops, never runs `down`. On a statement failure it stops and reports exactly
 * which statements ran — no automatic schema rollback.
 */
export async function applyPending(db, migrations, {
  dryRun = false, maintenance = false, log = () => {},
  lockWaitTimeout = DEFAULT_LOCK_WAIT, maxStatementTime = DEFAULT_MAX_STATEMENT_TIME,
  requireBackup = false, backupVerified = false,
} = {}) {
  validateMigrations(migrations)
  return withLock(db, async () => {
    const status = await computeStatus(db, migrations)
    if (status.problems.length) throw new Error(`refusing to migrate:\n  - ${status.problems.join('\n  - ')}`)
    const pending = migrations.filter((m) => status.pending.some((p) => p.id === m.id))
    if (!pending.length) { log('nothing to apply — schema is up to date'); return { applied: [] } }

    // Gate blocking / maintenance-only migrations out of the online path.
    for (const m of pending) {
      const c = classifyMigration(m)
      if (!c.onlineSafe && !maintenance) {
        throw new Error(`migration ${m.id} is maintenance-window-only (not online-safe): ${c.reasons.join('; ')}. It must be applied in a maintenance window.`)
      }
    }

    if (dryRun) {
      log(`[dry-run] ${BOOKKEEPING_TABLE} ensured`)
      for (const m of pending) {
        const c = classifyMigration(m)
        log(`[dry-run] ${m.id}: ${m.description || ''} [${c.onlineSafe ? 'online-safe' : 'MAINTENANCE'}]`)
        for (const s of m.up) log(`    ${norm(s).slice(0, 100)}`)
      }
      return { applied: [], dryRun: true, pending: pending.map((m) => m.id) }
    }

    if (requireBackup && !backupVerified) {
      throw new Error('refusing to apply: a verified backup is required for this target but none was provided (backupVerified=false).')
    }

    const session = await prepareSession(db, { lockWaitTimeout, maxStatementTime, online: !maintenance })
    log(`session: lock_wait_timeout=${session.lockWaitTimeout ?? 'default'}s max_statement_time=${session.maxStatementTime ?? 'default'}s${session.alterAlgorithm ? ' alter_algorithm=INPLACE' : ''}`)
    await ensureBookkeeping(db)
    const applied = []
    for (const m of pending) {
      log(`applying ${m.id} …`)
      let ran = 0
      try {
        for (const sql of m.up) { analyseUp(sql); await db.exec(sql); ran += 1 }
        await db.exec(
          `INSERT INTO ${BOOKKEEPING_TABLE} (id, source, description, checksum) VALUES (?, 'managed', ?, ?)`,
          [m.id, String(m.description || '').slice(0, 255), checksum(m)])
      } catch (e) {
        log(`  ${m.id} FAILED after ${ran}/${m.up.length} statement(s): ${e.code || e.message}`)
        log('  No automatic schema rollback. Statements use IF NOT EXISTS, so re-running is safe once the cause is fixed; restore from your backup if you took one.')
        throw e
      }
      applied.push(m.id)
      log(`  ${m.id} applied`)
    }
    return { applied }
  })
}

/**
 * Explicit one-time baseline: record 0001–0012 and 013 as applied — ONLY after
 * `verifySchema(db)` (a structural check) confirms the live schema matches the
 * expected final schema. Aborts (changing nothing) on any mismatch or if a
 * baseline already exists.
 */
export async function recordBaseline(db, migrations, { verifySchema, log = () => {}, force = false } = {}) {
  validateMigrations(migrations)
  if (typeof verifySchema !== 'function') throw new Error('recordBaseline requires a verifySchema function')
  const baseline = migrations.filter((m) => (m.source || 'managed') !== 'managed')
  if (!baseline.length) throw new Error('no baseline migrations defined')

  return withLock(db, async () => {
    const history = await readHistory(db)
    const already = baseline.filter((m) => history.has(m.id)).map((m) => m.id)
    if (already.length && !force) {
      throw new Error(`baseline already recorded for: ${already.join(', ')}. Refusing to re-baseline.`)
    }
    log('verifying live schema matches the expected final schema …')
    const v = await verifySchema(db)
    if (!v.ok) {
      throw new Error(`baseline ABORTED — live schema does not match expected final schema:\n  - ${v.problems.join('\n  - ')}`)
    }
    log(`  schema verified: ${v.summary || 'ok'}`)
    await ensureBookkeeping(db)
    for (const m of baseline) {
      if (history.has(m.id)) continue
      await db.exec(
        `INSERT INTO ${BOOKKEEPING_TABLE} (id, source, description, checksum) VALUES (?, 'baseline', ?, ?)`,
        [m.id, String(m.description || '').slice(0, 255), checksum(m)])
      log(`  recorded baseline ${m.id}`)
    }
    return { recorded: baseline.map((m) => m.id) }
  })
}

/**
 * Manual, confirmed, backup-gated reverse of the most recent MANAGED migration.
 * Never called by the deploy. Runs the migration's validated paired `down`.
 */
export async function migrateDown(db, migrations, { confirm = false, backupVerified = false, log = () => {} } = {}) {
  validateMigrations(migrations)
  if (!confirm) throw new Error('migrate down needs explicit confirmation (confirm: true)')
  if (!backupVerified) throw new Error('migrate down needs a verified backup (backupVerified: true) — it is destructive')
  return withLock(db, async () => {
    const status = await computeStatus(db, migrations)
    const blocking = status.problems
    if (blocking.length) throw new Error(`refusing to roll back:\n  - ${blocking.join('\n  - ')}`)
    const appliedManaged = status.applied.filter((a) => a.source === 'managed')
    const last = appliedManaged.at(-1)
    if (!last) { log('nothing to roll back'); return { reverted: null } }
    const m = migrations.find((x) => x.id === last.id)
    if (!m || !Array.isArray(m.down) || m.down.length === 0) throw new Error(`${last.id} has no down steps; manual intervention required`)
    log(`reverting ${m.id} …`)
    for (const sql of m.down) { analyseDown(sql); await db.exec(sql) }
    await db.exec(`DELETE FROM ${BOOKKEEPING_TABLE} WHERE id = ?`, [m.id])
    log(`  ${m.id} reverted`)
    return { reverted: m.id }
  })
}

/* -------------------------------------------------------------------------- */
/* Loaders (fs)                                                               */
/* -------------------------------------------------------------------------- */

export async function loadBaselineMigrations(databaseDir) {
  const migDir = join(databaseDir, 'migrations')
  const files = (await readdir(migDir)).filter((f) => /^\d{3,4}.*\.sql$/i.test(f)).sort()
  const baseline = []
  for (const file of files) {
    const text = await readFile(join(migDir, file), 'utf8')
    baseline.push({ id: file.replace(/\.sql$/i, ''), source: 'baseline', description: file, up: splitStatements(text), down: [] })
  }
  baseline.push({
    id: '013_forge_prefix',
    source: 'baseline',
    description: 'forge_ table prefix (migration 013; migrate-forge-prefix.mjs)',
    fingerprint: JSON.stringify(TABLE_RENAMES),
  })
  return baseline
}

export async function loadManagedMigrations(databaseDir) {
  const migDir = join(databaseDir, 'migrations')
  if (!existsSync(migDir)) return []
  const entries = await readdir(migDir, { withFileTypes: true })
  const dirs = entries.filter((e) => e.isDirectory() && /^\d{3,4}_[a-z0-9_]+$/i.test(e.name)).map((e) => e.name).sort()
  const managed = []
  for (const name of dirs) {
    const upPath = join(migDir, name, 'up.sql')
    if (!existsSync(upPath)) continue
    const up = splitStatements(await readFile(upPath, 'utf8'))
    const downPath = join(migDir, name, 'down.sql')
    const down = existsSync(downPath) ? splitStatements(await readFile(downPath, 'utf8')) : []
    let description = name
    let pairedDown = down.length > 0
    let maintenance = false
    const metaPath = join(migDir, name, 'meta.json')
    if (existsSync(metaPath)) {
      try {
        const meta = JSON.parse(await readFile(metaPath, 'utf8'))
        description = meta.description || name
        if (typeof meta.pairedDown === 'boolean') pairedDown = meta.pairedDown
        if (typeof meta.maintenance === 'boolean') maintenance = meta.maintenance
      } catch { /* keep defaults */ }
    }
    managed.push({ id: name, source: 'managed', description, up, down, pairedDown, maintenance })
  }
  return managed
}

export async function loadAllMigrations(databaseDir) {
  const baseline = await loadBaselineMigrations(databaseDir)
  const managed = await loadManagedMigrations(databaseDir)
  return [...baseline, ...managed]
}

export function mysqlAdapter(conn) {
  return {
    query: async (sql, params = []) => (await conn.query(sql, params))[0],
    exec: async (sql, params = []) => (await conn.query(sql, params))[0],
  }
}
