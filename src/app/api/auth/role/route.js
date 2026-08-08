import { ok, readJson, route } from '@/lib/api/respond'
import { requireIdentity } from '@/lib/auth/guard'
import { writeSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/config/navigation'
import { ForbiddenError, ValidationError } from '@/lib/errors'
import * as auth from '@/lib/services/auth.service'

/**
 * POST /api/auth/role   { role }
 *
 * Switches the active role. The requested role is checked against the roles
 * the user actually holds in the database — the role-select screen is a
 * convenience, not the authorisation boundary.
 */
export const POST = route(async (request) => {
  const identity = await requireIdentity()
  const { role } = await readJson(request)

  if (!role) throw new ValidationError('Choose a role to continue.')
  if (!auth.holdsRole(identity, role)) {
    throw new ForbiddenError('Your account does not hold that role.')
  }

  await writeSession({ userId: identity.user.id, role })
  return ok({ role, home: ROLE_HOME[role] ?? '/' })
})
