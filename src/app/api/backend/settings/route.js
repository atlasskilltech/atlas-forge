import { ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/** GET /api/backend/settings — every setting, grouped as the screen draws them. */
export const GET = route(async () => {
  await requireRole('backend-manager')
  return ok(await backend.getSettings())
})

/**
 * PATCH /api/backend/settings   { key, value }
 *
 * Only the Backend Manager may change these: they alter behaviour for every
 * user on the platform, and several are read as feature checks deep inside the
 * services. The value is coerced to the type the setting declares before it is
 * stored, and the lookup cache is cleared so the change takes effect at once.
 */
export const PATCH = route(async (request) => {
  await requireRole('backend-manager')
  const identity = await requirePermission('platform.settings.write')

  return ok(await backend.updateSetting(identity.user, await readJson(request)))
})
