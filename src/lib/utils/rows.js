import 'server-only'

/**
 * Helpers for turning driver rows into domain objects.
 *
 * Two MySQL/MariaDB realities every mapper has to handle:
 *
 *  1. `BOOLEAN` is `TINYINT(1)`, so the driver returns `0` / `1`, not `false` /
 *     `true`. `0` is falsy in JS but `!== false`, which breaks strict checks
 *     and JSON payloads.
 *  2. On MariaDB, `JSON` is an alias for `LONGTEXT`, so JSON columns come back
 *     as **strings**. The same column on MySQL 8 comes back parsed. `json()`
 *     accepts both so the layer above never has to care which server it is on.
 */

/** TINYINT(1) → boolean. */
export function bool(value) {
  return value === 1 || value === true || value === '1'
}

/** JSON column → object, tolerating MariaDB's string form and invalid content. */
export function json(value, fallback = null) {
  if (value === null || value === undefined) return fallback
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/** DATE/DATETIME/TIMESTAMP → ISO string, preserving null. */
export function iso(value) {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

/** BIGINT id → number, preserving null. */
export function num(value) {
  if (value === null || value === undefined) return null
  return Number(value)
}

/** Map a nullable row through a mapper. */
export function mapOne(row, mapper) {
  return row ? mapper(row) : null
}

/** Map a result set through a mapper. */
export function mapAll(rows, mapper) {
  return rows.map(mapper)
}

/**
 * Build the `IN (?, ?, ?)` fragment for a variable-length list.
 *
 * Placeholders are generated from the array's *length* only — the values still
 * travel to the driver as bound parameters, so this stays injection-safe.
 * Returns null for an empty list so callers can short-circuit rather than
 * emitting `IN ()`, which is a syntax error.
 */
export function inClause(values) {
  if (!Array.isArray(values) || values.length === 0) return null
  return `(${values.map(() => '?').join(', ')})`
}

/**
 * Expands a value for the `(? IS NULL OR col = ?)` optional-filter pattern,
 * which needs the same value bound twice. Writing `...pair(x)` keeps the
 * parameter array aligned with the statement — the commonest source of
 * off-by-one binding bugs.
 */
export function pair(value) {
  const normalised = value === undefined ? null : value
  return [normalised, normalised]
}

/**
 * Clamp pagination input. Rejects anything non-numeric so `limit`/`offset`
 * can be safely inlined — mysql2's prepared statements will not bind LIMIT
 * placeholders on all server versions.
 */
export function paginate({ page = 1, perPage = 25, maxPerPage = 100 } = {}) {
  const safePerPage = Math.min(Math.max(Number.parseInt(perPage, 10) || 25, 1), maxPerPage)
  const safePage = Math.max(Number.parseInt(page, 10) || 1, 1)
  return { limit: safePerPage, offset: (safePage - 1) * safePerPage, page: safePage, perPage: safePerPage }
}
