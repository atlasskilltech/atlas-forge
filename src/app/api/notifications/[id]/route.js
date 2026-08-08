import { ok, route } from '@/lib/api/respond'
import { requireIdentity } from '@/lib/auth/guard'
import { readNotification } from '@/lib/modules/shared'

/**
 * PATCH /api/notifications/:id — mark one notification read.
 *
 * The update is scoped by user id in the repository, so another account's
 * notification matches no rows and reports 404.
 */
export const PATCH = route(async (_request, { params }) => {
  const identity = await requireIdentity()
  const { id } = await params
  return ok(await readNotification(identity.user, id))
})
