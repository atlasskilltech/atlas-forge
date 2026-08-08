import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/home — stat cards, quick actions and recent activity. */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getHome(identity.user.id))
})
