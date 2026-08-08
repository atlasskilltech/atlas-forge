import { ok, route } from '@/lib/api/respond'
import { readPage, withPageHeaders } from '@/lib/api/pagination'
import { requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/**
 * GET /api/forge/logs — the platform audit trail.
 *
 * Optional `?page=&perPage=`; the default stays the newest 50 entries.
 */
export const GET = route(async (request) => {
  await requireRole('forge-manager')
  const page = readPage(request)
  const result = await forge.getPlatformLogs(page.requested ? page : null)

  return withPageHeaders(ok(result), { ...page, total: result.total })
})
