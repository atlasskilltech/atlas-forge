import { ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/**
 * GET /api/backend/access?q= — Role Management.
 *
 * The search runs on the server, so looking up one account never hands the
 * caller the whole directory to filter in the browser.
 */
export const GET = route(async (request) => {
  await requireRole('backend-manager')
  const query = new URL(request.url).searchParams.get('q')
  return ok(await backend.getRoleManagement(query))
})

/**
 * POST /api/backend/access   { userId }            — grant Founder access
 * DELETE /api/backend/access { grantId | userId }  — revoke it
 *
 * Both run as one transaction: the grant record, the role and the audit entry
 * move together, so an account is never left half-promoted or half-demoted.
 */
export const POST = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('access.grant')

  return ok(await backend.grantAccess(identity.user, await readJson(request)))
})

export const DELETE = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('access.revoke')

  return ok(await backend.revokeAccess(identity.user, await readJson(request)))
})
