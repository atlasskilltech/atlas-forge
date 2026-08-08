import { ok, route } from '@/lib/api/respond'
import { requireIdentity, requireRole } from '@/lib/auth/guard'
import * as student from '@/lib/modules/student'
import { getApplicationHistory } from '@/lib/modules/shared'

/**
 * GET /api/student/applications/:id — the status history of one application.
 *
 * Readable by the applicant and by whoever posted the listing, so it is
 * guarded by identity rather than by role — a founder reading their own
 * applicant's history is the same request.
 *
 * `application_events` has recorded every transition since Step 4; nothing
 * could read it back. The reference draws a chevron on each application row
 * but no expanded state, so there is no UI for it yet.
 */
export const GET = route(async (_request, { params }) => {
  const identity = await requireIdentity()
  const { id } = await params
  return ok(await getApplicationHistory(identity.user, id))
})

/**
 * DELETE /api/student/applications/:id — withdraw.
 *
 * An application belonging to somebody else reports 404, not 403: confirming
 * that an id exists would leak which listings other students have applied to.
 */
export const DELETE = route(async (_request, { params }) => {
  const identity = await requireRole('student')
  const { id } = await params

  return ok(await student.withdrawApplication(identity.user.id, id))
})
