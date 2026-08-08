import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/profile — the founder's account details and access badge. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getProfile(identity.user))
})

/**
 * PATCH /api/founder/profile   { name, email, bio }
 *
 * The user id comes from the session, never the body — a founder cannot edit
 * another account by changing a field.
 */
export const PATCH = route(async (request) => {
  const identity = await requireRole('founder')
  await founder.saveProfile(identity.user, await readJson(request))
  return ok(await founder.getProfile(identity.user))
})
