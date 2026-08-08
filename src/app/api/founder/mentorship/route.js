import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/mentorship — assigned mentor, sessions and mentor types. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getMentorship(identity.user))
})

/**
 * POST /api/founder/mentorship   { topic, context, mentorType, timing }
 *
 * The request is attached to the founder's startup, so the Forge Manager sees
 * which project it is for when assigning a mentor.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('mentorship.request')
  return created(await founder.requestMentorship(identity.user, await readJson(request)))
})
