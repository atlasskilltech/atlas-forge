import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import { ForbiddenError } from '@/lib/errors'
import * as registrations from '@/lib/modules/forge/registrations'
import { authService } from '@/lib/services'

/**
 * Public network registrations, as the Forge Manager sees them.
 *
 * Authorization is enforced here on the server, not by hiding buttons:
 *
 *   - `requireRole('forge-manager')` is the primary gate. A Backend Manager or
 *     Super Admin does NOT hold this role, so both are refused here even though
 *     a Backend Manager holds every permission — the role check runs first.
 *   - `incubation.review` is required to read and to reject.
 *   - `access.grant` is additionally required to approve, matching the public
 *     incubation flow: approval leads to account/access creation (Phase 6), so
 *     it asks for the same permission that granting access asks for anywhere.
 */

/** GET /api/forge/registrations — every registration, newest first. */
export const GET = route(async () => {
  const identity = await requireRole('forge-manager')
  authService.assertCan(identity, 'incubation.review')
  return ok(await registrations.getRegistrations())
})

/**
 * POST /api/forge/registrations
 *   { applicationId, decision: 'approve' }
 *   { applicationId, decision: 'reject', reason }
 *
 * Both are one-way: a decided registration answers 409 rather than being
 * decided twice.
 */
export const POST = route(async (request) => {
  const identity = await requireRole('forge-manager')
  const input = await readJson(request)

  authService.assertCan(identity, 'incubation.review')
  if (input.decision === 'approve' && !authService.can(identity, 'access.grant')) {
    throw new ForbiddenError('Your account cannot approve registrations.')
  }

  return ok(await registrations.decideRegistration(identity.user, input))
})
