/**
 * SQL for the authentication attempt log.
 *
 * Every window is computed inside MySQL — `NOW() - INTERVAL ? SECOND` — rather
 * than by sending a JavaScript `Date` as the boundary. The pool is configured
 * with `timezone: 'Z'` while the MySQL server's session timezone is SYSTEM, so
 * a timestamp crossing that boundary is re-labelled and shifts by the server's
 * UTC offset. Comparing and subtracting timestamps on the database side means
 * no value ever crosses it, and the limiter is correct regardless of where the
 * server is or how it is configured.
 *
 * `TIMESTAMPDIFF` returns how long the oldest failure in the window has been
 * there; the caller turns that into the remaining lockout.
 */

export const INSERT_ATTEMPT = `
  INSERT INTO login_attempts (identifier, ip_address, action, succeeded)
  VALUES (?, ?, ?, ?)
`

/** Failures for one identifier inside the window. */
export const COUNT_FAILURES_BY_IDENTIFIER = `
  SELECT COUNT(*)                                              AS failures,
         TIMESTAMPDIFF(SECOND, MIN(created_at), NOW())         AS elapsed_seconds
    FROM login_attempts
   WHERE action = ? AND identifier = ? AND succeeded = 0
     AND created_at >= NOW() - INTERVAL ? SECOND
`

export const COUNT_FAILURES_BY_IP = `
  SELECT COUNT(*)                                              AS failures,
         TIMESTAMPDIFF(SECOND, MIN(created_at), NOW())         AS elapsed_seconds
    FROM login_attempts
   WHERE action = ? AND ip_address = ? AND ip_address <> '' AND succeeded = 0
     AND created_at >= NOW() - INTERVAL ? SECOND
`

/**
 * Clears the failure streak after a correct password, so a user who mistyped
 * twice and then signed in does not stay two attempts from a lockout.
 * Successful rows are left in place — they are the useful half of the audit.
 */
export const CLEAR_FAILURES = `
  DELETE FROM login_attempts
   WHERE action = ? AND identifier = ? AND succeeded = 0
`

/** Retention sweep. Anything older than the cutoff can no longer affect a decision. */
export const PURGE_OLD_ATTEMPTS = `
  DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL ? SECOND
`
