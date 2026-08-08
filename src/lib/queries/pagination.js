import 'server-only'

import { logger } from '@/lib/logger'

/**
 * Row limits for list queries.
 *
 * MariaDB will not accept a bound parameter in the `LIMIT` clause of a prepared
 * statement, and mysql2 prepares every statement this application runs. So the
 * numbers are interpolated — but only after being proved to be integers inside
 * a fixed range. Nothing else in a query is ever built by string concatenation,
 * and no caller-supplied text reaches this function: it takes numbers or it
 * throws.
 *
 * Every list has a ceiling. A screen that renders "all users" is fine at 15 and
 * is a memory incident at 150,000, and the difference is a year of enrolment
 * rather than a code change.
 */

/** Applied when a caller asks for no particular page. */
export const DEFAULT_PAGE_SIZE = 50

/** The most any single request can ask for, however it asks. */
export const MAX_PAGE_SIZE = 200

/**
 * The ceiling for lists that are read whole because a screen shows them whole.
 *
 * Generous rather than tight: the point is to bound memory, not to truncate a
 * working screen. Crossing it is reported — see `capReached` — because the
 * screen has then silently stopped showing everything and needs the pagination
 * controls the reference set does not yet draw.
 */
export const FULL_LIST_CAP = 500

function integerWithin(value, { min, max, name }) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`Invalid ${name}: ${value}`)
  }
  return parsed
}

/**
 * Appends `LIMIT`, and `OFFSET` when a page beyond the first is asked for.
 *
 * @param {string} statement  A complete SELECT, already ordered.
 * @param {object} [page]     `{ limit, offset }`; omitted means no clause.
 */
export function withPagination(statement, { limit = null, offset = null } = {}) {
  if (limit === null || limit === undefined) return statement

  const rows = integerWithin(limit, { min: 1, max: MAX_PAGE_SIZE, name: 'page size' })
  const skip =
    offset === null || offset === undefined
      ? 0
      : integerWithin(offset, { min: 0, max: 1_000_000, name: 'page offset' })

  return skip > 0 ? `${statement} LIMIT ${rows} OFFSET ${skip}` : `${statement} LIMIT ${rows}`
}

/**
 * Appends the ceiling for a list read in full.
 *
 * One row over the cap is requested on purpose, so the caller can tell "exactly
 * at the cap" from "more than we returned" without a second COUNT query.
 */
/**
 * The clause a list endpoint that supports both modes needs.
 *
 * A caller asking for a page gets that page, bounded by `MAX_PAGE_SIZE`. A
 * caller asking for nothing gets the whole list, bounded by the much larger
 * `FULL_LIST_CAP`. Keeping the two ceilings separate is the point: one bounds
 * what a client may request, the other bounds what a screen may render, and
 * they are not the same number.
 */
export function withPageOrCap(statement, { limit = null, offset = null } = {}) {
  return limit === null || limit === undefined
    ? withFullListCap(statement)
    : withPagination(statement, { limit, offset })
}

export function withFullListCap(statement, cap = FULL_LIST_CAP) {
  const rows = integerWithin(cap, { min: 1, max: 10_000, name: 'list cap' })
  return `${statement} LIMIT ${rows + 1}`
}

/**
 * Trims the extra row `withFullListCap` asked for, and reports when it was
 * there.
 *
 * The warning is the point. A capped list is a screen that has quietly stopped
 * showing everything, and the people who need to know are the ones reading the
 * logs — not the user, who cannot tell, and not the developer, who will not be
 * looking on the day it first happens.
 */
export function applyFullListCap(rows, listName, cap = FULL_LIST_CAP) {
  if (rows.length <= cap) return rows
  logger.warn('list reached its cap and was truncated', {
    list: listName,
    cap,
    hint: 'this screen now needs pagination controls',
  })
  return rows.slice(0, cap)
}
