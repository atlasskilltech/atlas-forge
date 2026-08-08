import { ok, route } from '@/lib/api/respond'
import { readPage, withPageHeaders } from '@/lib/api/pagination'
import { requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/**
 * GET /api/backend/errors — platform errors and failed operations.
 *
 * Optional `?page=&perPage=`. This table grows on its own, without anybody
 * doing anything, which is why it is the first one that needed a ceiling.
 */
export const GET = route(async (request) => {
  await requireRole('backend-manager')
  const page = readPage(request)
  const result = await backend.getErrorLogs(page.requested ? page : null)

  return withPageHeaders(ok(result), { ...page, total: result.total })
})
