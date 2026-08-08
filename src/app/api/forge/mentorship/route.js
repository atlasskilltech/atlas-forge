import { ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/** GET /api/forge/mentorship — open requests, the mentor roster and the session log. */
export const GET = route(async () => {
  await requireRole('forge-manager')
  return ok(await forge.getMentorship())
})

/**
 * POST /api/forge/mentorship   { requestId, mentorId, scheduledAt }
 *
 * Closes the request, gives its placeholder session a mentor and notifies the
 * student — all in one transaction, so a student is never told a mentor was
 * assigned to a request that stayed open.
 */
export const POST = route(async (request) => {
  // The Backend Manager also holds this permission, so the role is checked too
  // — this is the Forge Manager's queue, and the assignment is audited as
  // theirs.
  await requireRole('forge-manager')
  const identity = await requirePermission('mentorship.assign')

  return ok(await forge.assignMentor(identity.user, await readJson(request)))
})
