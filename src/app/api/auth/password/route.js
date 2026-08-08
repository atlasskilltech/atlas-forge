import { ok, readJson, route } from '@/lib/api/respond'
import { requireIdentity } from '@/lib/auth/guard'
import { changeOwnPassword } from '@/lib/modules/shared'
import * as rateLimit from '@/lib/services/rate-limit.service'

/**
 * POST /api/auth/password   { currentPassword, newPassword, confirmPassword }
 *
 * Changes the caller's own password. The current password is verified even
 * though the caller holds a valid session — a session proves who opened the
 * browser, not who is at it now.
 *
 * The account is taken from the session, so this cannot be used to change
 * anyone else's. Resetting a *forgotten* password is a different problem
 * needing email delivery, and does not exist yet.
 *
 * Rate limited under its own action, separately from sign-in: an unattended
 * signed-in browser is otherwise an unlimited oracle for the current password.
 *
 * No UI: the reference set has no change-password screen.
 */
export const POST = route(async (request) => {
  const identity = await requireIdentity()
  const ipAddress = rateLimit.clientAddress(request)
  const limitKey = { action: 'password-change', identifier: identity.user.appId, ipAddress }

  await rateLimit.assertWithinLimit(limitKey)

  let result
  try {
    result = await changeOwnPassword(identity.user, await readJson(request))
  } catch (error) {
    await rateLimit.recordAttempt({ ...limitKey, succeeded: false })
    throw error
  }

  await rateLimit.recordAttempt({ ...limitKey, succeeded: true })
  return ok(result)
})
