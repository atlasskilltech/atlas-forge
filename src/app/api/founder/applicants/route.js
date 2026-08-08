import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/**
 * GET /api/founder/applicants — the founder's listings with their applicants.
 *
 * Only listings this founder created are included, so one founder can never
 * read who applied to another's roles.
 */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getApplicants(identity.user))
})

/**
 * PATCH /api/founder/applicants   { applicationId, status, note }
 *
 * Moves an applicant through Applied → Under Review → Shortlisted → Interview
 * → Selected, or declines them at any point with `not_selected`.
 *
 * The transition is validated against the pipeline in the service, so a
 * rejected application cannot be returned to the queue and a decided one
 * cannot be re-decided. `withdrawn` is refused here — that is the applicant's
 * own action, on their own endpoint.
 *
 * There is no UI for this yet: the reference set has no applicant status
 * control, only the status chip that displays the result. The endpoint exists
 * so the pipeline is complete and testable, and so the screen can be wired the
 * moment a design exists.
 */
export const PATCH = route(async (request) => {
  const identity = await requireRole('founder')
  return ok(await founder.decideApplicant(identity.user, await readJson(request)))
})
