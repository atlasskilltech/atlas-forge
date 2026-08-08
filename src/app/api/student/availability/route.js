import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/availability — current availability plus the skill catalogue. */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getAvailability(identity.user.id))
})

/** PUT /api/student/availability   { isAvailable, hoursPerWeek, workTypes, timing } */
export const PUT = route(async (request) => {
  const identity = await requireRole('student')
  const body = await readJson(request)

  await student.saveAvailability(identity.user.id, body)
  return ok(await student.getAvailability(identity.user.id))
})
