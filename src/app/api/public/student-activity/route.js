import { ok, route } from '@/lib/api/respond'
import { withPageHeaders } from '@/lib/api/pagination'
import { assertWithinRequestLimit } from '@/lib/api/ip-rate-limit'
import { ValidationError } from '@/lib/errors'
import { rateLimitService, studentActivityService } from '@/lib/services'

/**
 * GET /api/public/student-activity?applicationId=<university student app id>
 *
 * Returns ONE Atlas Student's ATLAS Forge profile, current state and recorded
 * activity, resolved from `registration_requests.student_application_id`.
 *
 * Intentionally PUBLIC and unauthenticated: no API key, no session. Anyone who
 * knows (or obtains) an Application ID can read that student's permitted record,
 * so the data returned is deliberately minimised — see the service and the
 * sensitive-field exclusions below. CORS is open because the data is public;
 * CORS governs browser access, it does not make the data private.
 *
 * Read-only: GET and OPTIONS only (any other verb → 405). No database writes.
 * Per-IP rate limited, with strict input validation and safe errors.
 *
 * Responses:
 *   200  { ok:true, data:{ student, currentState, activity, meta } }
 *   404  no student matches the Application ID
 *   409  the Application ID is on more than one registration (ambiguous)
 *   422  missing / malformed applicationId or pagination
 *   429  rate limited
 *
 * NEVER returned: passwords/hashes, session tokens, secrets, email, phone,
 * source IP, user agent, reviewer/actor identity, or internal numeric ids.
 */

const DEFAULT_PER_PAGE = 50
const MAX_PER_PAGE = 200
const MAX_APPLICATION_ID_LENGTH = 64

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

function positiveInt(raw, fallback, name) {
  if (raw === null || raw === '') return fallback
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new ValidationError(`${name} must be a whole number of 1 or more.`)
  }
  return parsed
}

const handleGet = route(async (request) => {
  assertWithinRequestLimit(rateLimitService.clientAddress(request))

  const params = new URL(request.url).searchParams

  const applicationId = (params.get('applicationId') ?? '').trim()
  if (!applicationId) {
    throw new ValidationError('applicationId is required.', {
      fields: { applicationId: 'Provide the University Student Application ID.' },
    })
  }
  if (applicationId.length > MAX_APPLICATION_ID_LENGTH) {
    throw new ValidationError('applicationId is too long.', {
      fields: { applicationId: `Must be ${MAX_APPLICATION_ID_LENGTH} characters or fewer.` },
    })
  }

  const page = positiveInt(params.get('page'), 1, 'page')
  const perPage = Math.min(
    positiveInt(params.get('perPage') ?? params.get('per_page'), DEFAULT_PER_PAGE, 'perPage'),
    MAX_PER_PAGE
  )

  const result = await studentActivityService.getStudentActivity({ applicationId, page, perPage })

  return withPageHeaders(ok(result), { page, perPage, total: result.meta.activityCount })
})

/**
 * `route()` always returns a Response (it catches and formats errors), so
 * wrapping its result adds CORS to success AND error responses alike.
 */
export async function GET(request, context) {
  return withCors(await handleGet(request, context))
}

/** CORS preflight. Read-only, so it advertises only GET. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
