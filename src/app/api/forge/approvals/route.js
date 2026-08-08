import { ok, readJson, route } from '@/lib/api/respond'
import { requirePermission, requireRole } from '@/lib/auth/guard'
import * as forge from '@/lib/modules/forge'

/** GET /api/forge/approvals — the queue with each listing's recorded decision. */
export const GET = route(async () => {
  await requireRole('forge-manager')
  return ok(await forge.getApprovalQueue())
})

/**
 * POST /api/forge/approvals   { listingId, decision, reason }
 *
 * One transaction records the decision, moves the listing, writes the audit
 * entry and notifies the founder. The decision is always recorded *as* the
 * Forge Manager, so a later Backend Manager override sits alongside it rather
 * than overwriting who decided what.
 */
export const POST = route(async (request) => {
  // Both checks, and both are load-bearing. The permission is also held by the
  // Backend Manager, so a permission check alone would let a Backend Manager's
  // verdict be filed here — and this endpoint records every decision *as* the
  // Forge Manager. A Backend Manager override belongs to the Backend module,
  // where it is recorded against that role and flagged as an override.
  await requireRole('forge-manager')
  const identity = await requirePermission('listing.approve')

  return ok(await forge.decideListing(identity.user, await readJson(request)))
})
