import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/home — startup counters, quick actions and the activity feed. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getHome(identity.user))
})
