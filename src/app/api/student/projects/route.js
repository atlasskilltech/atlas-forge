import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/projects — active startups and their filter tabs. */
export const GET = route(async () => {
  await requireRole('student')
  return ok(await student.getProjects())
})
