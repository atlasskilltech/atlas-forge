import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/mentorship — sessions, assigned mentor and mentor types. */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getMentorship(identity.user.id))
})

/**
 * POST /api/student/mentorship   { topic, context, mentorType, timing }
 *
 * Creates the request and its placeholder "Pending Assignment" session in one
 * transaction, so the student sees the request on their sessions list the
 * moment it is submitted.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('mentorship.request')
  const body = await readJson(request)

  return created(await student.requestMentorship(identity.user.id, body))
})
