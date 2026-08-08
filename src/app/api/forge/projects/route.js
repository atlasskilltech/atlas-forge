import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/** GET /api/forge/projects — every startup registered under Forge. */
export const GET = route(async () => {
  await requireRole('forge-manager')
  return ok(await forge.getProjects())
})

/**
 * PATCH /api/forge/projects   { startupId, featured }
 *
 * Featuring is what the Forge Manager controls on this screen; the founder
 * cannot set it on their own startup, which is why it lives here.
 */
export const PATCH = route(async (request) => {
  const identity = await requireRole('forge-manager')
  return ok(await forge.setFeatured(identity.user, await readJson(request)))
})
