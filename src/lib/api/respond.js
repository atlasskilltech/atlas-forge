import 'server-only'

import { AppError, ConflictError, ForbiddenError, ValidationError } from '@/lib/errors'
import { DatabaseError } from '@/lib/db'
import { logger, requestId, requestLogger } from '@/lib/logger'
import { platformService } from '@/lib/services'
import { assertBodyWithinLimits, MAX_BODY_BYTES } from '@/lib/validate'

/**
 * One response shape and one error policy for every Route Handler.
 *
 *   success  { ok: true,  data }
 *   failure  { ok: false, error: { code, message } }
 *
 * Only `AppError` subclasses — the errors the service layer raises on purpose —
 * reach the client with their own message and status. Everything else becomes
 * a generic 500. That matters most for `DatabaseError`, whose message can echo
 * a fragment of the failing SQL: it is logged on the server and replaced with
 * a neutral message in the response body.
 */

export function ok(data = null, init = {}) {
  return Response.json({ ok: true, data }, { status: 200, ...init })
}

export function created(data = null) {
  return ok(data, { status: 201 })
}

export function noContent() {
  return new Response(null, { status: 204 })
}

/**
 * Records an unexpected failure in `error_logs`.
 *
 * Fire-and-forget, and it swallows its own errors: this runs while we are
 * already failing, and a logging problem must not replace the response the
 * caller is waiting for. `console.error` above stays as the guaranteed
 * fallback for exactly that case.
 *
 * Only genuine faults are recorded. An `AppError` is the application working —
 * a 404 or a 422 is an answer, not an incident — and storing those would bury
 * the real ones.
 */
function record(error, request, id) {
  try {
    platformService
      .logError({
        level: error instanceof DatabaseError ? 'critical' : 'error',
        message: `${error?.name ?? 'Error'}: ${error?.message ?? 'Unknown failure'}`.slice(0, 500),
        stackTrace: error?.stack ?? null,
        context: {
          // The same id is on the log line and in the response header, so a
          // user quoting "request 3f9c…" leads straight to both.
          requestId: id ?? null,
          method: request?.method ?? null,
          path: request ? new URL(request.url).pathname : null,
          code: error?.code ?? null,
        },
      })
      .catch(() => {})
  } catch {
    /* never let logging break the response */
  }
}

/**
 * MySQL rejections that are really the caller's fault, translated.
 *
 * Without this every one of them is a 500 saying "something went wrong", which
 * is both wrong — the server is fine, the input is not — and useless to the
 * person who typed the value. The driver names the offending column in its
 * message; that name is the most useful part and is safe to pass on, unlike
 * the SQL fragment around it.
 */
const COLUMN_PATTERN = /column '([^']+)'/i
const KEY_PATTERN = /for key '([^']+)'/i

function translateDatabaseError(error) {
  const column = COLUMN_PATTERN.exec(error?.cause?.message ?? '')?.[1]
  const field = column ? column.replace(/_/g, ' ') : 'A submitted value'

  switch (error.code) {
    case 'ER_DUP_ENTRY': {
      const key = KEY_PATTERN.exec(error?.cause?.message ?? '')?.[1]
      return new ConflictError(
        key?.includes('uq_') || key
          ? 'That record already exists.'
          : 'That value is already taken.'
      )
    }
    case 'ER_DATA_TOO_LONG':
      return new ValidationError(`${capitalise(field)} is too long.`, {
        fields: column ? { [column]: 'Too long for this field.' } : undefined,
      })
    case 'WARN_DATA_TRUNCATED':
    case 'ER_TRUNCATED_WRONG_VALUE':
    case 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD':
    case 'ER_INVALID_JSON_TEXT':
      return new ValidationError(`${capitalise(field)} is not in a valid format.`, {
        fields: column ? { [column]: 'Not a valid value.' } : undefined,
      })
    case 'ER_WARN_DATA_OUT_OF_RANGE':
      return new ValidationError(`${capitalise(field)} is out of range.`, {
        fields: column ? { [column]: 'Out of range.' } : undefined,
      })
    case 'ER_BAD_NULL_ERROR':
      return new ValidationError(`${capitalise(field)} is required.`, {
        fields: column ? { [column]: 'Required.' } : undefined,
      })
    case 'ER_NO_REFERENCED_ROW':
    case 'ER_NO_REFERENCED_ROW_2':
      return new ValidationError('That refers to a record that no longer exists.')
    case 'ER_ROW_IS_REFERENCED':
    case 'ER_ROW_IS_REFERENCED_2':
      return new ConflictError('That record is still in use and cannot be removed.')
    default:
      return null
  }
}

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1)

export function failure(error, request, id, boundLogger) {
  const log = boundLogger ?? logger

  if (error instanceof AppError) {
    // Built field by field rather than from `toJSON()`, which returns its own
    // `{ error: … }` wrapper — nesting the two produced `error.error.message`
    // and left every client showing the generic fallback text.
    return Response.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      {
        status: error.status,
        // A rate-limited caller is told when to come back in the header the
        // HTTP spec reserves for it, not only in the message.
        ...(error.retryAfterSeconds
          ? { headers: { 'Retry-After': String(error.retryAfterSeconds) } }
          : {}),
      }
    )
  }

  if (error instanceof DatabaseError) {
    // A rejection caused by the submitted values is answered as such, and is
    // logged at warn rather than error: it is the application working.
    const translated = translateDatabaseError(error)
    if (translated) {
      log.warn('rejected by the database', { code: error.code, as: translated.code })
      return failure(translated, request, id, log)
    }

    log.error('database error', { code: error.code, sql: error.sql, cause: error.cause })
  } else {
    log.error('unhandled error', { error })
  }

  record(error, request, id)

  return Response.json(
    {
      ok: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
        // Given to the user so support can find this exact failure in the log
        // and in `error_logs` without asking them to reproduce it.
        ...(id ? { requestId: id } : {}),
      },
    },
    { status: 500 }
  )
}

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Rejects a state-changing request that a different site initiated.
 *
 * The session cookie is `SameSite=Lax`, which already keeps it off cross-site
 * POSTs, and a JSON body triggers a CORS preflight this app never answers.
 * This is the third lock on the same door, and the only one that keeps working
 * if either of those is ever relaxed.
 *
 * A request with NO `Origin` header is allowed through: that is a server-side
 * client — a script, a health check, the test suites — not a browser being
 * steered by another site. A browser always sends `Origin` on a mutation, so
 * the case this guards is never the case it waives.
 */
function assertSameOrigin(request) {
  const method = request?.method?.toUpperCase?.()
  if (!method || SAFE_METHODS.includes(method)) return

  const origin = request.headers?.get?.('origin')
  if (!origin) return

  // Behind a reverse proxy the public host arrives forwarded; `host` is then
  // the internal one and would never match the browser's Origin.
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return

  let originHost
  try {
    originHost = new URL(origin).host
  } catch {
    throw new ForbiddenError('Cross-site request blocked.')
  }

  if (originHost !== host) throw new ForbiddenError('Cross-site request blocked.')
}

/**
 * Wraps a handler so no route needs its own try/catch.
 *
 * @example
 *   export const GET = route(async () => ok(await something()))
 */
export function route(handler) {
  return async function handle(request, context) {
    const id = requestId(request)
    const log = requestLogger(request, id)

    try {
      assertSameOrigin(request)
      return stamp(await handler(request, context), id)
    } catch (error) {
      return stamp(failure(error, request, id, log), id)
    }
  }
}

/**
 * Puts the request id on the response.
 *
 * Wrapped in a try: a `Response` whose headers guard is immutable throws on
 * `set`, and losing the correlation header is never worth losing the response.
 */
function stamp(response, id) {
  try {
    response?.headers?.set('x-request-id', id)
  } catch {
    /* header is a convenience, not the payload */
  }
  return response
}

/**
 * Parse a JSON body, treating malformed input as an empty object.
 *
 * Malformed JSON stays an empty object rather than an error: the route's own
 * checks then report which fields are missing, which is a more useful answer
 * than "your JSON is broken". An over-large body is a different matter — it is
 * refused before it is parsed, because parsing it is the expensive part.
 */
export async function readJson(request) {
  const declared = Number(request?.headers?.get?.('content-length') ?? 0)
  if (declared > MAX_BODY_BYTES) {
    throw new AppError('The submitted data is too large.', {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return {}
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) return {}

  // Throws a 422 for a field no column could hold, before any service sees it.
  assertBodyWithinLimits(body)
  return body
}
