import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/** GET /api/forge/contacts — every Concierge contact made by any founder. */
export const GET = route(async () => {
  await requireRole('forge-manager')
  return ok(await forge.getContacts())
})
