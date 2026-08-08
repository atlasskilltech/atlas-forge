import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/collabs — the engagement options for the collab form. */
export const GET = route(async () => {
  await requireRole('student')
  return ok(await student.getCollabOptions())
})

/**
 * POST /api/student/collabs   { title, summary, collaborator, skills, engagement }
 *
 * Always posted as a collab, never a job, regardless of what the body says.
 * Whether it goes live or waits for the Forge Manager is read from platform
 * settings rather than hard-coded.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('listing.create')
  const body = await readJson(request)

  return created(await student.postCollab(identity.user.id, body))
})
