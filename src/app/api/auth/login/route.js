import { ok, readJson, route } from '@/lib/api/respond'
import { writeSession } from '@/lib/auth/session'
import * as auth from '@/lib/services/auth.service'
import * as rateLimit from '@/lib/services/rate-limit.service'

/**
 * POST /api/auth/login   { appId, password }
 *
 * On success the session cookie is issued for the user's primary role. Users
 * who hold more than one role still pass through /select-role, which switches
 * the active role via /api/auth/role.
 *
 * Attempts are counted per App ID and per client address. The limit is checked
 * before the password is verified, so a locked-out caller never reaches the
 * hash comparison, and the outcome is recorded either way.
 */
export const POST = route(async (request) => {
  const { appId, password } = await readJson(request)
  const ipAddress = rateLimit.clientAddress(request)

  await rateLimit.assertWithinLimit({ action: 'login', identifier: appId, ipAddress })

  let identity
  try {
    identity = await auth.authenticate(appId, password)
  } catch (error) {
    await rateLimit.recordAttempt({ action: 'login', identifier: appId, ipAddress, succeeded: false })
    throw error
  }

  await rateLimit.recordAttempt({ action: 'login', identifier: appId, ipAddress, succeeded: true })
  await writeSession({ userId: identity.user.id, role: identity.defaultRole?.slug ?? null })

  return ok({
    user: {
      name: identity.user.name,
      appId: identity.user.appId,
      initials: identity.user.initials,
    },
    roles: identity.roles.map((role) => role.slug),
    defaultRole: identity.defaultRole?.slug ?? null,
  })
})
