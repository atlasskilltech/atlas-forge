import 'server-only'

import { transaction } from '@/lib/db'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import * as listings from '@/lib/repositories/listings.repository'
import * as platform from '@/lib/repositories/platform.repository'
import { getListingTypes, getContractTypes, getRoleBySlug, getSettingsMap } from './lookups.service'
import { resolveId } from './lookups.service'

/**
 * Job and collab listings, including the approval workflow shared by the Forge
 * Manager and the Backend Manager.
 *
 * Approving a listing touches three tables — the listing, the approvals record
 * and the audit log — so every decision runs inside one transaction. A partial
 * write here would leave a listing live with no record of who approved it.
 */

export const browse = (filters) => listings.findAll(filters)
export const getById = (id) => listings.findById(id)
export const getApprovalQueue = (filters) => listings.findApprovalQueue(filters)
export const countByStatus = () => listings.countByStatus()

export function listLive(filters = {}) {
  return listings.findAll({ ...filters, status: 'live' })
}

export function listForStartup(startupId) {
  return listings.findAll({ startupId })
}

/**
 * Create a listing. Whether it goes live immediately or waits for approval is
 * decided by platform settings, not hard-coded.
 */
export async function create(input, actorId) {
  if (!input?.title?.trim()) throw new ValidationError('A title is required.')

  const settings = await getSettingsMap()
  const requiresApproval =
    input.type === 'collab'
      ? settings.collab_posts_require_approval !== false
      : settings.job_listings_require_approval !== false

  const [listingTypeId, contractTypeId] = await Promise.all([
    resolveId(getListingTypes, input.listingTypeSlug),
    resolveId(getContractTypes, input.contractTypeSlug),
  ])

  return transaction(async (tx) => {
    const listingId = await listings.create(
      {
        type: input.type ?? 'job',
        title: input.title.trim(),
        description: input.description ?? null,
        startupId: input.startupId ?? null,
        createdBy: actorId,
        listingTypeId,
        contractTypeId,
        compensation: input.compensation ?? null,
        collaboratorNeed: input.collaboratorNeed ?? null,
        status: requiresApproval ? 'pending' : 'live',
      },
      tx
    )

    if (Array.isArray(input.skillIds) && input.skillIds.length > 0) {
      await listings.addSkills(listingId, input.skillIds, tx)
    }

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Posted ${input.type === 'collab' ? 'Collab' : 'Job'}: ${input.title.trim()}`,
        module: 'Hiring',
        entityType: 'listing',
        entityId: listingId,
        status: requiresApproval ? 'pending' : 'success',
      },
      tx
    )

    return listingId
  })
}

/**
 * Record an approve/reject decision for a listing.
 *
 * `roleSlug` is the role the decision is made *as*, which is what allows the
 * Backend Manager's decision to sit alongside the Forge Manager's rather than
 * replacing it. A Backend Manager decision over an existing Forge Manager one
 * is flagged as an override.
 */
export async function decide({ listingId, decision, roleSlug, actorId, reason = null }) {
  if (!['approved', 'rejected'].includes(decision)) {
    throw new ValidationError('Decision must be "approved" or "rejected".')
  }

  const listing = await listings.findById(listingId)
  if (!listing) throw new NotFoundError('Listing')

  const role = await getRoleBySlug(roleSlug)
  if (!role) throw new ValidationError(`Unknown role: ${roleSlug}`)

  // A Backend Manager decision counts as an override only when the Forge
  // Manager has already decided — one targeted lookup, not a queue scan.
  const isOverride =
    roleSlug === 'backend-manager' &&
    Boolean(await listings.findDecision(listingId, 'forge-manager'))

  return transaction(async (tx) => {
    await listings.recordDecision(
      { listingId, roleId: role.id, decision, decidedBy: actorId, reason, isOverride },
      tx
    )
    await listings.updateStatus(listingId, decision === 'approved' ? 'live' : 'rejected', tx)

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `${decision === 'approved' ? 'Approved' : 'Rejected'} ${
          listing.type === 'collab' ? 'Collab Post' : 'Job Listing'
        }: ${listing.title}${reason ? ` — '${reason}'` : ''}`,
        module: 'Hiring',
        entityType: 'listing',
        entityId: listingId,
        status: decision === 'approved' ? 'success' : 'action',
      },
      tx
    )

    // Tell the person who posted it.
    await platform.createNotification(
      {
        userId: listing.createdBy.id,
        type: 'listing',
        title: decision === 'approved' ? 'Listing approved' : 'Listing rejected',
        body: `${listing.title} was ${decision} by the ${role.name}.`,
        linkUrl: '/founder/listings',
        entityType: 'listing',
        entityId: listingId,
      },
      tx
    )

    return true
  })
}

/** Guard used by the apply flow — a closed or pending listing cannot take applications. */
export async function assertOpenForApplications(listingId) {
  const listing = await listings.findById(listingId)
  if (!listing) throw new NotFoundError('Listing')
  if (listing.status !== 'live') {
    throw new ConflictError('This listing is not open for applications.')
  }
  return listing
}
