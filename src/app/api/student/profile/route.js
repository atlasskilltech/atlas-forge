import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/profile — profile, skills and activity counters. */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getProfile(identity.user.id))
})

/**
 * PATCH /api/student/profile   { name, email, bio }
 *
 * The user id comes from the session, never from the body, so a caller cannot
 * edit somebody else's profile by changing a field.
 */
export const PATCH = route(async (request) => {
  const identity = await requireRole('student')
  const body = await readJson(request)

  await student.saveProfile(identity.user.id, body)
  return ok(await student.getProfile(identity.user.id))
})
