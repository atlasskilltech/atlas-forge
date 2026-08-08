import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/** GET /api/forge/listings — every job and collab listing, with its status counts. */
export const GET = route(async () => {
  await requireRole('forge-manager')
  return ok(await forge.getListings())
})
