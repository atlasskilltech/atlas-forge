import 'server-only'

import { TooManyRequestsError } from '@/lib/errors'

/**
 * A tiny in-process, fixed-window rate limiter for public, unauthenticated GET
 * endpoints.
 *
 * Why in-memory rather than the DB-backed `rate-limit.service`: that limiter is
 * failure-counting for password endpoints and is backed by the `login_attempts`
 * table. A read endpoint needs a plain per-IP request cap, and giving it one
 * without a new table or migration means keeping the counters in process. This
 * app is served by a single Node process (`next start` behind the reverse
 * proxy), so a per-process window is effective here; it would need shared
 * storage only if the app were ever scaled to multiple instances.
 *
 * The map is swept lazily — expired windows are dropped as they are next seen,
 * and a periodic sweep bounds it if a burst of distinct IPs is never seen
 * again — so it cannot grow without limit.
 */

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 60
const SWEEP_EVERY = 1_000

/** @type {Map<string, { count: number, resetAt: number }>} */
const windows = new Map()
let sinceSweep = 0

function sweep(now) {
  for (const [key, entry] of windows) {
    if (entry.resetAt <= now) windows.delete(key)
  }
}

/**
 * Counts one request from `ip` and throws `TooManyRequestsError` (→ HTTP 429
 * with a `Retry-After` header, handled by `respond.failure`) once the window's
 * allowance is spent. A request with no resolvable IP is not limited — it has
 * no key to count against — which matches how the password limiter treats a
 * missing address.
 */
export function assertWithinRequestLimit(ip, { windowMs = WINDOW_MS, max = MAX_PER_WINDOW } = {}) {
  if (!ip) return

  const now = Date.now()
  if ((sinceSweep += 1) >= SWEEP_EVERY) {
    sinceSweep = 0
    sweep(now)
  }

  const entry = windows.get(ip)
  if (!entry || entry.resetAt <= now) {
    windows.set(ip, { count: 1, resetAt: now + windowMs })
    return
  }

  entry.count += 1
  if (entry.count > max) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
    throw new TooManyRequestsError('Too many requests. Please slow down and try again.', retryAfter)
  }
}
