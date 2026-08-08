import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/hiring — each hiring tab's listings, plus applicants per own listing. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getHiring(identity.user))
})
