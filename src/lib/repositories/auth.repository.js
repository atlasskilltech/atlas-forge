import 'server-only'

import { execute, insert, queryOne } from '@/lib/db'
import * as sql from '@/lib/queries/auth'
import { num } from '@/lib/utils/rows'

/**
 * Persistence for the authentication attempt log.
 *
 * Windows are passed as a number of seconds, not as a boundary timestamp: the
 * comparison and the elapsed-time arithmetic both happen inside MySQL, so no
 * timestamp crosses the driver boundary where the pool's `timezone: 'Z'` and
 * the server's SYSTEM timezone would disagree about what it means.
 */

const toWindow = (row) => ({
  failures: num(row?.failures) ?? 0,
  // How long the oldest failure still inside the window has been there.
  // NULL when there are none — COUNT is then 0 and this is never read.
  elapsedSeconds: num(row?.elapsed_seconds) ?? 0,
})

export function recordAttempt({ identifier, ipAddress = '', action = 'login', succeeded = false }) {
  return insert(sql.INSERT_ATTEMPT, [identifier, ipAddress, action, succeeded ? 1 : 0])
}

export async function failuresForIdentifier(action, identifier, windowSeconds) {
  return toWindow(
    await queryOne(sql.COUNT_FAILURES_BY_IDENTIFIER, [action, identifier, windowSeconds])
  )
}

export async function failuresForIp(action, ipAddress, windowSeconds) {
  return toWindow(await queryOne(sql.COUNT_FAILURES_BY_IP, [action, ipAddress, windowSeconds]))
}

export function clearFailures(action, identifier) {
  return execute(sql.CLEAR_FAILURES, [action, identifier])
}

export function purgeAttemptsOlderThan(seconds) {
  return execute(sql.PURGE_OLD_ATTEMPTS, [seconds])
}
