import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/incubation — the founder's incubation application summary. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getIncubation(identity.user))
})
