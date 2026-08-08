import { ok, route } from '@/lib/api/respond'
import { readPage, withPageHeaders } from '@/lib/api/pagination'
import { requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/**
 * GET /api/backend/logs — the immutable platform audit trail.
 *
 * Optional `?page=&perPage=`. Without them the newest 100 entries are returned,
 * exactly as before; the page size and total travel in headers so the table's
 * body keeps the shape the screen already renders.
 */
export const GET = route(async (request) => {
  await requireRole('backend-manager')
  const page = readPage(request)
  const result = await backend.getAuditTable(page.requested ? page : null)

  return withPageHeaders(ok(result), { ...page, total: result.total })
})
