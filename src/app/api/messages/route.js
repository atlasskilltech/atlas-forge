import { created, ok, route, readJson } from '@/lib/api/respond'
import { readPage, withPageHeaders } from '@/lib/api/pagination'
import { requireIdentity } from '@/lib/auth/guard'
import { getMessages, messageForgeManager } from '@/lib/modules/shared'

/**
 * GET /api/messages — what the caller has sent and received.
 *
 * The other half of Contact Forge Manager: messages were stored from Phase 1
 * but nothing could read them back. Both sides are scoped to the session, so
 * no account can read another's correspondence.
 *
 * No UI: the reference set has no inbox.
 *
 * Optional `?page=&perPage=`, applied to each direction; `x-total-count` is
 * the two totals combined.
 */
export const GET = route(async (request) => {
  const identity = await requireIdentity()
  const page = readPage(request)
  const result = await getMessages(identity.user, page.requested ? page : null)

  return withPageHeaders(ok(result), { ...page, total: result.total })
})

/**
 * POST /api/messages   { subject, message }
 *
 * Contact Forge Manager. Available to any signed-in account, because that is
 * what the screen offers on both the Student and Founder areas — it is the
 * escalation path, not a privileged action.
 *
 * The recipient is resolved from the Forge Manager role on the server. The
 * request cannot name one: this endpoint is a route to staff, not a general
 * messaging API, and accepting a recipient id would quietly make it one.
 */
export const POST = route(async (request) => {
  const identity = await requireIdentity()
  return created(await messageForgeManager(identity.user, await readJson(request)))
})
