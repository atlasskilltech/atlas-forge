import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as admin from '@/lib/modules/admin'

/**
 * GET /api/admin/profile — the shared account screen.
 *
 * There is no PATCH. Super Admin is view-only, so the Save control on the
 * shared profile is disabled for this role rather than posting to an endpoint
 * that would refuse it.
 */
export const GET = route(async () => {
  const identity = await requireRole('super-admin')
  return ok(await admin.getProfile(identity.user))
})
