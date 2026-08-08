import { ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'
import { studentsService } from '@/lib/services'
import { ValidationError } from '@/lib/errors'

/** GET /api/backend/profile — the shared account screen for this manager. */
export const GET = route(async () => {
  const identity = await requireRole('backend-manager')
  return ok(await backend.getProfile(identity.user))
})

/**
 * PATCH /api/backend/profile   { name, email, bio }
 *
 * Edits the caller's own account, taken from the session. Changing somebody
 * else's account is Role Management, which is a different endpoint with its
 * own audit trail.
 */
export const PATCH = route(async (request) => {
  const identity = await requireRole('backend-manager')
  const body = await readJson(request)

  if (!body?.name?.trim()) throw new ValidationError('Your name is required.')
  if (!body?.email?.trim()) throw new ValidationError('Your email is required.')

  await studentsService.updateProfile(identity.user.id, {
    name: body.name.trim(),
    email: body.email.trim(),
    bio: body.bio?.trim() || null,
  })

  return ok(await backend.getProfile(identity.user))
})
