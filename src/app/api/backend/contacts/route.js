import { ok, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as backend from '@/lib/modules/backend'

/** GET /api/backend/contacts — every Concierge contact, shared with the Forge Manager. */
export const GET = route(async () => {
  await requireRole('backend-manager')
  return ok(await backend.getContacts())
})
