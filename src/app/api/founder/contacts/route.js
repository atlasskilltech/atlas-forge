import { created, ok, readJson, route } from '@/lib/api/respond'
import { requireRole } from '@/lib/auth/guard'
import * as founder from '@/lib/modules/founder'

/** GET /api/founder/contacts — the founder's own contact log and its counters. */
export const GET = route(async () => {
  const identity = await requireRole('founder')
  return ok(await founder.getContactLog(identity.user))
})

/**
 * POST /api/founder/contacts   { studentId, context, duration, message }
 *
 * The Forge Manager CC is applied inside the service from the
 * `contact_log_auto_cc` platform setting, so the promise every screen makes is
 * kept whether or not the client asks for it.
 */
export const POST = route(async (request) => {
  const identity = await requireRole('founder')
  return created(await founder.contactStudent(identity.user, await readJson(request)))
})

/**
 * PATCH /api/founder/contacts   { contactId, status }
 *
 * Moves an outreach through pending → ongoing → done. The status chips on the
 * Contact Log have always rendered this column; nothing could change it until
 * now, so every contact stayed at the status it was created with.
 *
 * Only the founder who made the outreach may update it. No UI: the reference
 * draws the chip but no control.
 */
export const PATCH = route(async (request) => {
  const identity = await requireRole('founder')
  return ok(await founder.updateContactStatus(identity.user, await readJson(request)))
})
