import { ok, readJson, route } from '@/lib/api/respond'
import { requireIdentity } from '@/lib/auth/guard'
import { writeSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/config/navigation'
import { ROLES } from '@/config/roles'
import { isAssignableRole } from '@/lib/auth/role-policy'
import { ForbiddenError, ValidationError } from '@/lib/errors'
import { rolesService } from '@/lib/services'

/**
 * POST /api/auth/act-as   { role }
 *
 * Backend Manager testing mode: from now on, behave exactly as `role` (its
 * permissions, menus and areas only). `role: 'backend-manager'` switches back.
 *
 * Only a user whose REAL role (from the database, not the cookie) is Backend
 * Manager may call this — including while already acting as another role, so
 * they can always switch back. The user's role in the database never changes.
 */
export const POST = route(async (request) => {
  const identity = await requireIdentity()
  const realRole = identity.realRole ?? identity.defaultRole
  if (realRole?.slug !== ROLES.BACKEND_MANAGER) {
    throw new ForbiddenError('Only a Backend Manager can switch roles.')
  }

  const { role } = await readJson(request)
  if (!isAssignableRole(role)) throw new ValidationError('Choose one of the five roles.')

  const actingAs = role === ROLES.BACKEND_MANAGER ? null : role
  await writeSession({
    userId: identity.user.id,
    role,
    viaGoogle: Boolean(identity.session?.viaGoogle),
    actingAs,
  })
  await rolesService.logActAs({ actorId: identity.user.id, roleSlug: role })

  return ok({ role, actingAs, home: ROLE_HOME[role] ?? '/select-role' })
})
