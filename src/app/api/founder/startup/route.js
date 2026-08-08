import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/startup — the founder's own startup page and team. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getStartup(identity.user))
})

/**
 * PUT /api/founder/startup
 *   { name, tagline, problemStatement, industrySlug, stageSlug, isHiring, openRoles, readiness }
 *
 * Serves both modes of the shared form: it creates the startup when the
 * founder has none and updates it otherwise. A newly created startup starts
 * `pending` — filling in a profile is a submission, not an approval.
 */
export const PUT = route(async (request) => {
  const identity = await requireRole('founder')
  const result = await founder.saveStartupProfile(identity.user, await readJson(request))
  return ok(result)
})
