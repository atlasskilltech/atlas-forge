import { ok, route } from '@/lib/api/respond'
import { readPage, withPageHeaders } from '@/lib/api/pagination'
import { requireIdentity } from '@/lib/auth/guard'
import { getNotifications } from '@/lib/modules/shared'

/**
 * GET /api/notifications — the caller's own notifications and unread count.
 *
 * Every role has the bell in its navbar, so this is not role-scoped. The user
 * id comes from the session; there is no way to ask for another account's.
 *
 * No UI yet: the reference draws the bell but no dropdown or inbox. The rows
 * have been written since Step 4 and were unreadable until now.
 *
 * Optional `?page=&perPage=` — notifications accumulate for the life of an
 * account, so this is one of the lists that will need it first.
 */
export const GET = route(async (request) => {
  const identity = await requireIdentity()
  const page = readPage(request)
  const result = await getNotifications(identity.user, page.requested ? page : null)

  return withPageHeaders(ok(result), { ...page, total: result.total })
})
