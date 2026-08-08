import { ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/** GET /api/backend/job-queue — every listing, with the Forge Manager's verdict. */
export const GET = route(async () => {
  await requireRole('backend-manager')
  return ok(await backend.getJobQueue())
})

/**
 * POST /api/backend/job-queue   { listingId, decision, reason }
 *
 * Recorded *as* the Backend Manager. Where the Forge Manager has already
 * decided, the service flags this as an override and both records survive —
 * the unique key on (listing_id, decided_as_role_id) is what makes that
 * possible, and it is why the two roles have separate endpoints.
 */
export const POST = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('listing.override')

  return ok(await backend.decideListing(identity.user, await readJson(request)))
})
