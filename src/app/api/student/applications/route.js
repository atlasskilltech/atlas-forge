import { created, ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'

/** GET /api/student/applications — every role this student has applied to. */
export const GET = route(async () => {
  const identity = await requireRole('student')
  return ok(await student.getApplications(identity.user.id))
})

/**
 * POST /api/student/applications   { listingId }
 *
 * Applying twice returns 409 rather than creating a second row: the unique key
 * on (listing_id, applicant_user_id) is what actually prevents it, so two
 * simultaneous clicks cannot both succeed.
 */
export const POST = route(async (request) => {
  const identity = await requirePermission('application.create')
  const { listingId } = await readJson(request)

  const result = await student.applyToListing(identity.user.id, listingId)
  return created(result)
})
