import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/projects — every startup under Forge, with the caller's flagged. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getProjects(identity.user))
})
