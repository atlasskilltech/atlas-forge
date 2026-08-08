import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/** GET /api/forge/incubation — submitted applications and who already has access. */
export const GET = route(async () => {
  await requireRole('forge-manager')
  return ok(await forge.getIncubation())
})

/**
 * POST /api/forge/incubation   { applicationId, reason }
 *
 * Grants Founder access. Three things happen together — the application is
 * approved, a grant is recorded with its actor, and the founder role is added
 * — so an applicant can never be left half-promoted.
 */
export const POST = route(async (request) => {
  const identity = await requireRole('forge-manager')
  return ok(await forge.grantFounderAccess(identity.user, await readJson(request)))
})
