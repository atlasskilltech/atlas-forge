import { ok, route } from '@/lib/api/respond'
import { withPageHeaders } from '@/lib/api/pagination'
import { assertWithinRequestLimit } from '@/lib/api/ip-rate-limit'
import { ValidationError } from '@/lib/errors'
import { rateLimitService, registrationService } from '@/lib/services'

/**
 * GET /api/public/registrations
 *
 * A deliberately PUBLIC, read-only view of the ATLAS Forge Network
 * registrations (`registration_requests`, the `/register` form). It takes no
 * session and no API key — another project on another domain fetches it
 * directly — so its safety comes from what it can reach, not from who is
 * asking:
 *
 *   - It only reads. There is no POST/PUT/PATCH/DELETE here, so Next answers any
 *     other verb with 405, and nothing in this file can create, approve, reject
 *     or modify a registration or an account.
 *   - It returns a fixed, safe subset of columns (see `registrationService
 *     .listPublic` and `SELECT_PUBLIC_REGISTRATIONS`): reference, name, email,
 *     category, status, submission date. No phone, free-text answers, IP, user
 *     agent, review/audit fields, credentials or internal id are ever exposed.
 *   - It is paginated with a hard page-size ceiling, and per-IP rate limited.
 *   - It sends permissive CORS (any origin) because the data is intentionally
 *     public; CORS governs browser access, it does not make the data private.
 *
 * Query parameters:
 *   ?status=pending|approved|rejected   optional filter (omit, or `all`, = any)
 *   ?page=<n>                            1-based page, default 1
 *   ?perPage=<n>                         page size, default 20, max 100
 */

const DEFAULT_PER_PAGE = 20
const MAX_PER_PAGE = 100

const ALLOWED_STATUSES = new Set(registrationService.PUBLIC_REGISTRATION_STATUSES)

/** Open, read-only CORS: any origin may GET this, no credentials. */
const CORS_HEADERS = Object.freeze({
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
})

function withCors(response) {
  try {
    for (const [key, value] of Object.entries(CORS_HEADERS)) response.headers.set(key, value)
  } catch {
    /* an immutable header guard must never cost us the response */
  }
  return response
}

/**
 * A 1-or-more integer, or the fallback when the parameter is absent. Anything
 * else is the caller's bug (`page=0`, `perPage=abc`) and is rejected as a 422
 * rather than silently corrected.
 */
function positiveInt(raw, fallback, name) {
  if (raw === null || raw === '') return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError(`${name} must be a whole number of 1 or more.`)
  }
  return parsed
}

function parseStatus(raw) {
  if (raw === null || raw === '' || raw === 'all') return null
  if (!ALLOWED_STATUSES.has(raw)) {
    throw new ValidationError("status must be one of 'pending', 'approved', 'rejected'.")
  }
  return raw
}

const handleGet = route(async (request) => {
  assertWithinRequestLimit(rateLimitService.clientAddress(request))

  const params = new URL(request.url).searchParams
  const status = parseStatus(params.get('status'))
  const page = positiveInt(params.get('page'), 1, 'page')
  const perPage = Math.min(
    positiveInt(params.get('perPage') ?? params.get('per_page'), DEFAULT_PER_PAGE, 'perPage'),
    MAX_PER_PAGE
  )

  const { registrations, total } = await registrationService.listPublic({
    status,
    limit: perPage,
    offset: (page - 1) * perPage,
  })

  const totalPages = total === 0 ? 0 : Math.ceil(total / perPage)

  const response = ok({
    registrations,
    pagination: { page, perPage, total, totalPages, hasMore: page < totalPages },
  })
  return withPageHeaders(response, { page, perPage, total })
})

/**
 * `route()` catches everything and always returns a Response, so wrapping its
 * result adds CORS to success AND error responses alike — a cross-origin caller
 * can then read a 422 or 429 body, not just a 200.
 */
export async function GET(request, context) {
  return withCors(await handleGet(request, context))
}

/** CORS preflight. Read-only, so it advertises only GET. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
