import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import { ForbiddenError } from '@/lib/errors'
import * as outsider from '@/lib/modules/forge/outsider'
import { authService } from '@/lib/services'

/**
 * Public (outsider) incubation applications, as the Forge Manager sees them.
 *
 * The same role gate as `/api/forge/incubation`, plus the permissions the
 * reference data already gives that role: `incubation.review` to read and
 * reject, and `access.grant` to approve — approval creates Founder access, so
 * it asks for the same permission granting it does anywhere else.
 */

/** GET /api/forge/outsider-applications — every public application, newest first. */
export const GET = route(async () => {
  const identity = await requireRole('forge-manager')
  authService.assertCan(identity, 'incubation.review')
  return ok(await outsider.getOutsiderApplications())
})

/**
 * POST /api/forge/outsider-applications
 *   { applicationId, decision: 'approve' }
 *   { applicationId, decision: 'reject', reason }
 *
 * Both are one-way: a decided application answers 409 rather than being
 * decided twice.
 */
export const POST = route(async (request) => {
  const identity = await requireRole('forge-manager')
  const input = await readJson(request)

  authService.assertCan(identity, 'incubation.review')
  if (input.decision === 'approve' && !authService.can(identity, 'access.grant')) {
    throw new ForbiddenError('Your account cannot grant Founder access.')
  }

  return ok(await outsider.decideOutsiderApplication(identity.user, input))
})
