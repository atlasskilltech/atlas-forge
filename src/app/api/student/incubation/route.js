import { created, ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/incubation — stages, readiness checklist and past applications. */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getIncubation(identity.user.id))
})

/**
 * POST /api/student/incubation   { ideaName, problem, stage, team, readiness, asDraft }
 *
 * The stored readiness percentage is recomputed from the submitted evidence
 * inside the service rather than trusted from the client, so the ring on the
 * Forge Manager's queue always matches what was actually provided.
 */
export const POST = route(async (request) => {
  const identity = await requireRole('student')
  const body = await readJson(request)

  return created(await student.submitIncubation(identity.user.id, body))
})
