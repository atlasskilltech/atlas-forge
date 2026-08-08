import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/**
 * GET /api/student/jobs — live jobs and collabs, each flagged with whether
 * this student has already applied.
 */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getJobs(identity.user.id))
})
