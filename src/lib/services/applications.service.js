import 'server-only'

import { DatabaseError, transaction } from '@/lib/db'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import * as applications from '@/lib/repositories/applications.repository'
import * as platform from '@/lib/repositories/platform.repository'
import { assertOpenForApplications } from './listings.service'

/**
 * The hiring pipeline, in order.
 *
 * A status may only move *forward* along this list. Skipping ahead is allowed
 * — interviewing someone without formally shortlisting them is ordinary — but
 * moving backwards is not: an application that has been rejected must not be
 * quietly returned to the queue, and history should read as a progression
 * rather than a walk.
 */
const PIPELINE = ['applied', 'under_review', 'shortlisted', 'interview', 'selected']

/**
 * States nothing can leave. `not_selected` and `selected` are the two outcomes;
 * `withdrawn` is the student's own exit. Once an application reaches one of
 * these, its story is over — reopening it would mean a new application, which
 * the unique key on (listing_id, applicant_user_id) deliberately prevents.
 */
const TERMINAL = ['selected', 'not_selected', 'withdrawn']

const VALID_STATUSES = [...PIPELINE, 'not_selected', 'withdrawn']

/**
 * Whether `from` may become `to`.
 *
 * Rejection is reachable from any live stage — a founder can decline at any
 * point. Withdrawal likewise, but only by the applicant, which the caller
 * enforces because this function does not know who is asking.
 */
export function canTransition(from, to) {
  if (!VALID_STATUSES.includes(to)) return false
  if (from === to) return false
  if (TERMINAL.includes(from)) return false
  if (to === 'not_selected' || to === 'withdrawn') return true

  const currentStage = PIPELINE.indexOf(from)
  const nextStage = PIPELINE.indexOf(to)
  return currentStage >= 0 && nextStage > currentStage
}

/** The moves available from a given status, for a UI that offers choices. */
export function nextStatuses(from) {
  return VALID_STATUSES.filter((status) => canTransition(from, status))
}

export const listForUser = (userId) => applications.findAll({ applicantId: userId })
export const listForStartup = (startupId) => applications.findAll({ startupId })
export const listForListing = (listingId) => applications.findApplicantsForListing(listingId)
export const getById = (id) => applications.findById(id)
export const getHistory = (id) => applications.findEvents(id)
export const countActive = (userId) => applications.countActiveForUser(userId)

/**
 * Apply to a listing.
 *
 * The unique key on (listing_id, applicant_user_id) is the real guard against
 * double-applying — checking first would still race. The duplicate error is
 * caught and translated rather than pre-empted.
 */
export async function apply({ listingId, applicantId, coverNote = null }) {
  const listing = await assertOpenForApplications(listingId)

  try {
    return await transaction(async (tx) => {
      const applicationId = await applications.create({ listingId, applicantId, coverNote }, tx)

      await applications.recordEvent(
        { applicationId, toStatus: 'applied', changedBy: applicantId },
        tx
      )

      await platform.logActivity(
        {
          actorUserId: applicantId,
          action: `Applied for ${listing.title}${listing.startup ? ` at ${listing.startup.name}` : ''}`,
          module: 'Hiring',
          entityType: 'application',
          entityId: applicationId,
          status: 'pending',
        },
        tx
      )

      await platform.createNotification(
        {
          userId: listing.createdBy.id,
          type: 'application',
          title: 'New application received',
          body: `Someone applied for ${listing.title}.`,
          linkUrl: '/founder/applicants',
          entityType: 'application',
          entityId: applicationId,
        },
        tx
      )

      return applicationId
    })
  } catch (error) {
    if (error instanceof DatabaseError && error.isDuplicate) {
      throw new ConflictError('You have already applied to this listing.')
    }
    throw error
  }
}

/**
 * Move an application to a new status, writing the transition to history.
 *
 * The transition is checked against the pipeline, not merely against the list
 * of known statuses: previously any status could become any other, so a
 * rejected application could be returned to the queue and a withdrawn one
 * revived.
 */
export async function changeStatus({ applicationId, status, actorId, note = null }) {
  if (!VALID_STATUSES.includes(status)) {
    throw new ValidationError(`Unknown application status: ${status}`)
  }

  const application = await applications.findById(applicationId)
  if (!application) throw new NotFoundError('Application')
  if (application.status === status) return application

  if (!canTransition(application.status, status)) {
    throw new ConflictError(
      `An application that is "${label(application.status)}" cannot become "${label(status)}".`
    )
  }

  return transaction(async (tx) => {
    await applications.updateStatus(applicationId, status, tx)
    await applications.recordEvent(
      {
        applicationId,
        fromStatus: application.status,
        toStatus: status,
        changedBy: actorId,
        note,
      },
      tx
    )

    await platform.createNotification(
      {
        userId: application.applicant.id,
        type: 'application',
        title: 'Application status updated',
        body: `${application.listing.title} is now "${status.replace(/_/g, ' ')}".`,
        linkUrl: '/student/applications',
        entityType: 'application',
        entityId: applicationId,
      },
      tx
    )

    // Recorded on the platform trail as well as the application's own history,
    // so the transition is visible to the Forge Manager, the Backend Manager
    // and the Super Admin, none of whom read `application_events`.
    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Application ${label(status)}: ${application.applicant.name} — ${application.listing.title}`,
        module: 'Hiring',
        entityType: 'application',
        entityId: applicationId,
        status: status === 'selected' ? 'success' : status === 'not_selected' ? 'action' : 'pending',
      },
      tx
    )

    return { ...application, status }
  })
}

/** `under_review` → `Under Review`, for messages a person will read. */
function label(status) {
  return String(status)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function withdraw(applicationId, actorId) {
  return changeStatus({ applicationId, status: 'withdrawn', actorId })
}
