import { ok, route } from '@/lib/api/respond'
import { getIdentity } from '@/lib/auth/guard'

/**
 * GET /api/auth/session — who the caller is, or `null`.
 *
 * Returns only what the chrome needs to render. Permissions stay on the server:
 * the client is never the authority on what it may do.
 */
export const GET = route(async () => {
  const identity = await getIdentity()
  if (!identity) return ok(null)

  return ok({
    user: {
      name: identity.user.name,
      appId: identity.user.appId,
      initials: identity.user.initials,
      email: identity.user.email,
    },
    roles: identity.roles.map((role) => ({ slug: role.slug, name: role.name })),
    activeRole: identity.activeRole?.slug ?? null,
  })
})
