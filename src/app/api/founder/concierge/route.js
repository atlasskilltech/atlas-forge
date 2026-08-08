import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/concierge — the student pool, filter tracks and recent outreach. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getConcierge(identity.user))
})
