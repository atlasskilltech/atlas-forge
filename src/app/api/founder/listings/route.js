import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/listings — the field options for Post a Job. */
export const GET = route(async () => {
  await requireRole('founder')
  return ok(await founder.getJobFormOptions())
})

/**
 * POST /api/founder/listings
 *   { title, description, roleType, contractType, compensation, skills }
 *
 * Posted against the founder's own startup, taken from the session rather than
 * the body. Whether it goes live or waits for the Forge Manager is read from
 * platform settings inside the service.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('listing.create')
  return created(await founder.postJob(identity.user, await readJson(request)))
})
