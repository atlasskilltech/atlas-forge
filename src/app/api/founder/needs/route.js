import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/needs — talent needs this founder has posted. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getPostedNeeds(identity.user))
})

/**
 * POST /api/founder/needs   { title, description }
 *
 * Posts a talent need through Concierge, attached to the founder's own startup.
 * My Posted Needs could list these from Step 5 but nothing could create one.
 *
 * No UI: the screen has no reference frame and no form.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('concierge.contact')
  return created(await founder.postNeed(identity.user, await readJson(request)))
})
