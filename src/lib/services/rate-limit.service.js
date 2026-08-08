import 'server-only'

import { rateLimitConfig } from '@/lib/config/env'
import { logger } from '@/lib/logger'
import { TooManyRequestsError } from '@/lib/errors'
import * as attempts from '@/lib/repositories/auth.repository'

/**
 * Rate limiting for the endpoints that accept a password.
 *
 * Two counters guard every protected action:
 *
 *   identifier — stops one account being ground through a password list.
 *   IP address — stops one client spraying a common password across many
 *                accounts, which the per-identifier counter cannot see.
 *
 * The IP allowance is deliberately the looser of the two. A whole campus can
 * share one NAT address, so a tight IP limit would lock out a lecture theatre
 * because one person forgot their password.
 *
 * Only failures count. A user signing in normally never approaches a limit,
 * and a correct password clears the streak outright.
 */

/**
 * Seconds until the oldest failure in the window ages out, so the caller is
 * told when the allowance actually frees up rather than a flat guess.
 *
 * `elapsedSeconds` is measured by MySQL against its own clock — see the query
 * module for why the subtraction does not happen here.
 */
function retryAfter(elapsedSeconds, windowSeconds) {
  return Math.min(windowSeconds, Math.max(1, windowSeconds - (elapsedSeconds ?? 0)))
}

/**
 * Throws `TooManyRequestsError` when either counter is exhausted.
 *
 * Called *before* the password is checked, so a locked-out caller never
 * reaches the hash comparison. The message is deliberately the same whether
 * the identifier exists or not — the lockout must not become an oracle for
 * which App IDs are real.
 */
export async function assertWithinLimit({ action = 'login', identifier, ipAddress = '' } = {}) {
  const { windowSeconds, maxPerIdentifier, maxPerIp } = rateLimitConfig
  if (maxPerIdentifier <= 0 && maxPerIp <= 0) return // disabled by configuration

  const key = normalise(identifier)

  if (maxPerIdentifier > 0 && key) {
    const { failures, elapsedSeconds } = await attempts.failuresForIdentifier(
      action,
      key,
      windowSeconds
    )
    if (failures >= maxPerIdentifier) {
      throw new TooManyRequestsError(
        'Too many failed attempts. Wait a few minutes and try again.',
        retryAfter(elapsedSeconds, windowSeconds)
      )
    }
  }

  if (maxPerIp > 0 && ipAddress) {
    const { failures, elapsedSeconds } = await attempts.failuresForIp(
      action,
      ipAddress,
      windowSeconds
    )
    if (failures >= maxPerIp) {
      throw new TooManyRequestsError(
        'Too many failed attempts from this network. Wait a few minutes and try again.',
        retryAfter(elapsedSeconds, windowSeconds)
      )
    }
  }
}

/**
 * Records the outcome of an attempt.
 *
 * Never throws: a failure to write the audit row must not turn a successful
 * sign-in into an error, nor mask an authentication failure the caller needs
 * to see. It is logged and swallowed.
 */
export async function recordAttempt({ action = 'login', identifier, ipAddress = '', succeeded = false } = {}) {
  const key = normalise(identifier)
  if (!key) return

  try {
    if (succeeded) {
      await attempts.clearFailures(action, key)
    }
    const id = await attempts.recordAttempt({ identifier: key, ipAddress, action, succeeded })
    await maybePurge(id)
  } catch (error) {
    logger.error('could not record a login attempt', { action, error })
  }
}

/**
 * Retention sweep, run on roughly one insert in a hundred.
 *
 * Rows older than the retention period can no longer influence a decision, so
 * this is housekeeping rather than correctness — hence piggy-backing on an
 * insert instead of requiring a scheduled job the deployment may not have.
 */
async function maybePurge(insertId) {
  if (!insertId || insertId % 100 !== 0) return
  await attempts.purgeAttemptsOlderThan(rateLimitConfig.retentionSeconds)
}

/** Lower-cased and trimmed so `atl-2024-0871` and `ATL-2024-0871` share a counter. */
function normalise(identifier) {
  return typeof identifier === 'string' ? identifier.trim().toLowerCase().slice(0, 190) : ''
}

/**
 * The client address, taken from the proxy headers a reverse proxy sets.
 *
 * `x-forwarded-for` is client-controllable unless the proxy in front of the
 * app overwrites it, which is why the identifier counter — which no header can
 * influence — is the primary defence and this one is the wider safety net.
 */
export function clientAddress(request) {
  const forwarded = request?.headers?.get?.('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim().slice(0, 45)
  return (request?.headers?.get?.('x-real-ip') ?? '').trim().slice(0, 45)
}
