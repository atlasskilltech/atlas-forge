import 'server-only'

import { resolveSessionCookieName } from '@/lib/auth/cookie-name'

/**
 * Validated, typed access to environment configuration.
 *
 * Every value the data layer needs is read here and nowhere else, so pointing
 * the application at a different MySQL server is purely an `.env.local` change.
 * Reading a missing required variable throws at startup with a message naming
 * the variable, rather than surfacing later as an opaque connection error.
 */

function required(name) {
  const value = process.env[name]
  if (value === undefined || value === null || value === '') {
    throw new Error(
      `Missing required environment variable ${name}. ` +
        'Copy .env.example to .env.local and fill it in.'
    )
  }
  return value
}

/** Optional string — `''` is a legitimate value (e.g. a blank MySQL password). */
function optional(name, fallback = '') {
  const value = process.env[name]
  return value === undefined ? fallback : value
}

function integer(name, fallback) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  const parsed = Number.parseInt(raw, 10)
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be an integer, received "${raw}".`)
  }
  return parsed
}

function boolean(name, fallback = false) {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

/**
 * `DB_PASSWORD` is intentionally read with `optional`: a blank root password is
 * valid on a local XAMPP install, and `required` would reject it.
 */
export const dbConfig = Object.freeze({
  host: required('DB_HOST'),
  port: integer('DB_PORT', 3306),
  user: required('DB_USER'),
  password: optional('DB_PASSWORD'),
  database: required('DB_NAME'),
  connectionLimit: integer('DB_CONNECTION_LIMIT', 10),
  queueLimit: integer('DB_QUEUE_LIMIT', 0),
  connectTimeout: integer('DB_CONNECT_TIMEOUT_MS', 10_000),
  ssl: boolean('DB_SSL', false),
  sslCa: optional('DB_SSL_CA'),
  debug: boolean('DB_DEBUG', false),
})

export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Session cookie configuration.
 *
 * `SESSION_SECRET` signs the cookie. It is `required` on purpose: a default
 * would mean every deployment that forgot to set it shared a forgeable key,
 * and a signature everybody can compute is the same as no signature at all.
 */
export const sessionConfig = Object.freeze({
  secret: required('SESSION_SECRET'),
  // Resolved through the shared helper so the proxy — which cannot import this
  // server-only module — always agrees on the name, including the `__Host-`
  // prefix added in production.
  cookieName: resolveSessionCookieName(),
  ttlSeconds: integer('SESSION_TTL_HOURS', 12) * 3600,
})

/**
 * Rate limiting for password-accepting endpoints.
 *
 * Setting either maximum to 0 disables that counter, which is what the
 * automated suites do: they sign in wrongly on purpose, dozens of times, and
 * would otherwise lock themselves out halfway through a run.
 */
export const rateLimitConfig = Object.freeze({
  windowSeconds: integer('AUTH_RATE_LIMIT_WINDOW_MINUTES', 15) * 60,
  maxPerIdentifier: integer('AUTH_RATE_LIMIT_MAX_ATTEMPTS', 8),
  maxPerIp: integer('AUTH_RATE_LIMIT_IP_MAX_ATTEMPTS', 40),
  retentionSeconds: integer('AUTH_RATE_LIMIT_RETENTION_HOURS', 72) * 3600,
})

/** Credentials-safe summary for health checks and error reporting. */
export function describeDbTarget() {
  return `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
}
