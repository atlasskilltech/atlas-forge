import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/** GET /api/backend/dashboard — platform counters, override controls and recent activity. */
export const GET = route(async () => {
  await requireRole('backend-manager')
  return ok(await backend.getDashboard())
})
