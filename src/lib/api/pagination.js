import 'server-only'

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@/lib/queries/pagination'
import { ValidationError } from '@/lib/errors'

/**
 * Reading and reporting pages at the HTTP boundary.
 *
 * Paging is opt-in and the response body never changes shape: a list endpoint
 * returns the same JSON array it always did, and the page metadata travels in
 * headers. That is what lets the backend gain pagination while the screens —
 * which the reference set draws without any pagination controls — carry on
 * working untouched.
 *
 *   GET /api/backend/logs?page=2&perPage=25
 *   → body:    [ … 25 entries … ]
 *   → headers: x-total-count: 340
 *              x-page: 2
 *              x-per-page: 25
 *              x-total-pages: 14
 *
 * A request with no `page` or `perPage` is answered exactly as before.
 */

export function readPage(request) {
  let params
  try {
    params = new URL(request.url).searchParams
  } catch {
    return { requested: false, limit: null, offset: null, page: 1, perPage: null }
  }

  const rawPage = params.get('page')
  const rawPerPage = params.get('perPage') ?? params.get('per_page')

  if (rawPage === null && rawPerPage === null) {
    // Nothing asked for: behave as this endpoint always has.
    return { requested: false, limit: null, offset: null, page: 1, perPage: null }
  }

  const page = positive(rawPage, 1, 'page')
  const perPage = Math.min(positive(rawPerPage, DEFAULT_PAGE_SIZE, 'perPage'), MAX_PAGE_SIZE)

  return { requested: true, page, perPage, limit: perPage, offset: (page - 1) * perPage }
}

function positive(raw, fallback, name) {
  if (raw === null || raw === '') return fallback
  const parsed = Number(raw)
  // Rejected rather than silently corrected: a client sending `page=0` has a
  // bug, and quietly serving page 1 hides it until the data is wrong.
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError(`${name} must be a whole number of 1 or more.`)
  }
  return parsed
}

/**
 * Adds the page headers to a response.
 *
 * `total` is optional: an endpoint that cannot count cheaply still reports the
 * page it served, and omits what it does not know rather than guessing.
 */
export function withPageHeaders(response, { page, perPage, total } = {}) {
  try {
    if (page !== undefined) response.headers.set('x-page', String(page))
    if (perPage !== undefined && perPage !== null) {
      response.headers.set('x-per-page', String(perPage))
    }
    if (total !== undefined && total !== null) {
      response.headers.set('x-total-count', String(total))
      if (perPage) {
        response.headers.set('x-total-pages', String(Math.max(1, Math.ceil(total / perPage))))
      }
    }
  } catch {
    /* metadata is a convenience; never lose the body over it */
  }
  return response
}
