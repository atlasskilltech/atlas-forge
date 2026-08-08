import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/**
 * PUT /api/student/skills   { skillIds: number[] }
 *
 * Replaces the whole set, because that is how the screen edits it. Ids are
 * validated against the skills catalogue before anything is written.
 */
export const PUT = route(async (request) => {
  const identity = await requireRole('student')
  const { skillIds } = await readJson(request)

  await student.saveSkills(identity.user.id, skillIds)
  return ok(await student.getAvailability(identity.user.id))
})
