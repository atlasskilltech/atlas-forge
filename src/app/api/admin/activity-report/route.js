import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as admin from '@/lib/modules/admin'

/**
 * GET /api/admin/activity-report — the platform activity summary.
 *
 * Read-only, like every route in this module. Super Admin holds only `*.view`
 * permissions, so there is no verb here but GET — and nothing in
 * `@/lib/modules/admin` that a POST could call even if one were added.
 */
export const GET = route(async () => {
  await requireRole('super-admin')
  return ok(await admin.getActivityReport())
})
