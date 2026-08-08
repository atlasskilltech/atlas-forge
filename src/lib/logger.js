/**
 * Structured application logging.
 *
 * Every line is one JSON object in production, so a log shipper can index the
 * fields instead of parsing prose:
 *
 *   {"ts":"2026-08-06T11:00:40.512Z","level":"error","msg":"unhandled error",
 *    "requestId":"3f9c…","method":"POST","path":"/api/messages","code":"ER_DUP_ENTRY"}
 *
 * In development the same call prints a short human line, because a developer
 * reading a terminal is not a log shipper.
 *
 * Deliberately dependency-free and deliberately not `server-only`: the same
 * module is imported by the proxy, which runs in a restricted runtime where a
 * logging library would not load.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40, silent: 100 }

const isProduction = process.env.NODE_ENV === 'production'

/** `LOG_LEVEL` overrides; otherwise info in production, debug in development. */
const threshold = LEVELS[process.env.LOG_LEVEL] ?? (isProduction ? LEVELS.info : LEVELS.debug)

/**
 * Field names whose values are never written, in any casing.
 *
 * A log file outlives the request it describes and is copied to places the
 * database never goes, so a credential that reaches it has effectively been
 * published. Redaction happens here rather than at each call site because the
 * call site is exactly where it gets forgotten.
 */
const SECRET_KEYS = [
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'passwordhash',
  'password_hash',
  'secret',
  'token',
  'authorization',
  'cookie',
  'sessionsecret',
]

const isSecret = (key) => SECRET_KEYS.includes(String(key).toLowerCase().replace(/[-_]/g, ''))

/**
 * Makes a value safe and small enough to log: secrets masked, long strings
 * clipped, cycles broken, depth bounded.
 */
function sanitise(value, depth = 0) {
  if (value === null || value === undefined) return value
  if (typeof value === 'string') return value.length > 2000 ? `${value.slice(0, 2000)}…` : value
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (typeof value === 'bigint') return value.toString()
  if (value instanceof Date) return value.toISOString()
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: value.code, stack: value.stack }
  }
  if (depth >= 4) return '[deep]'
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitise(item, depth + 1))
  if (typeof value === 'object') {
    const output = {}
    for (const [key, item] of Object.entries(value)) {
      output[key] = isSecret(key) ? '[redacted]' : sanitise(item, depth + 1)
    }
    return output
  }
  return String(value)
}

function emit(level, message, fields) {
  if (LEVELS[level] < threshold) return

  const payload = { ts: new Date().toISOString(), level, msg: String(message), ...sanitise(fields ?? {}) }

  // `console.error` for warn and above so the two streams stay separated:
  // stdout carries the narrative, stderr carries what needs attention.
  const write = LEVELS[level] >= LEVELS.warn ? console.error : console.log

  if (isProduction) {
    write(JSON.stringify(payload))
    return
  }

  const { ts, level: _level, msg, ...rest } = payload
  const detail = Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : ''
  write(`${ts.slice(11, 23)} ${level.toUpperCase().padEnd(5)} ${msg}${detail}`)
}

/**
 * A logger that stamps the same fields onto every line — used to attach the
 * request id, so one request's logs can be pulled out of an interleaved file.
 */
function bind(bound = {}) {
  return {
    debug: (message, fields) => emit('debug', message, { ...bound, ...fields }),
    info: (message, fields) => emit('info', message, { ...bound, ...fields }),
    warn: (message, fields) => emit('warn', message, { ...bound, ...fields }),
    error: (message, fields) => emit('error', message, { ...bound, ...fields }),
    child: (fields) => bind({ ...bound, ...fields }),
  }
}

export const logger = bind()

/**
 * A logger bound to one HTTP request.
 *
 * The id is taken from an incoming `x-request-id` when a reverse proxy or load
 * balancer already assigned one, so a single identifier follows the request
 * across every hop rather than restarting at this process.
 */
export function requestLogger(request, requestId) {
  return logger.child({
    requestId,
    method: request?.method ?? null,
    path: safePath(request),
  })
}

export function requestId(request) {
  const forwarded = request?.headers?.get?.('x-request-id')
  if (forwarded) return forwarded.slice(0, 64)
  return crypto.randomUUID()
}

export function safePath(request) {
  if (!request?.url) return null
  try {
    // The path only — a query string can carry a search term or an id that
    // belongs in the database, not in a log file.
    return new URL(request.url).pathname
  } catch {
    return null
  }
}
