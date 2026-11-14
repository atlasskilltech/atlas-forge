import { ok, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/**
 * GET /api/backend/users/delete-preview?userId=
 *
 * Read-only: what a permanent delete of this user would remove, for the
 * confirmation dialog. Nothing is changed.
 */
export const GET = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('user.manage')
  const userId = new URL(request.url).searchParams.get('userId')
  return ok(await backend.previewUserDelete(identity.user, userId))
})
