import { ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/**
 * POST /api/backend/reset   { confirm: "RESET" }
 *
 * The Danger Zone action. It clears exactly what the confirmation dialog
 * promises — job listings, applications, contact logs and activity records —
 * and nothing else: every user account, role, startup, incubation application,
 * founder grant and all reference data survive.
 *
 * The confirmation phrase is required by the endpoint, not just by the dialog,
 * so a stray request cannot clear the platform without stating its intent.
 */
export const POST = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('platform.reset')

  return ok(await backend.resetPlatform(identity.user, await readJson(request)))
})
