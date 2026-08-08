import 'server-only'

import { NotFoundError, ValidationError } from '@/lib/errors'
import {
  applicationsService,
  authService,
  listingsService,
  platformService,
  startupsService,
  studentsService,
} from '@/lib/services'
import { toSharedProfile } from '@/lib/modules/backend/presenter'
import { dayTimeLabel } from '@/lib/utils/format'
import { LIMITS, validator } from '@/lib/validate'

/**
 * Screens that are the same for more than one role.
 *
 * The manager roles share one profile design rather than having their own, so
 * the assembly lives here instead of inside whichever module happened to need
 * it first. Contact Forge Manager is the same: it appears for students and
 * founders and behaves identically, so it is assembled once.
 */

export async function getSharedProfile(user) {
  const [directoryRow, startup] = await Promise.all([
    studentsService.listAll().then((rows) => rows.find((row) => row.id === user.id)),
    startupsService.getForOwner(user.id),
  ])

  const slugs = directoryRow?.roleSlugs ?? []
  const names = directoryRow?.roleNames ?? []
  const roles = slugs.map((slug, index) => ({ slug, name: names[index] ?? slug }))

  return { profile: toSharedProfile(user, roles, startup?.name) }
}

/**
 * Send a message to the Forge Manager.
 *
 * The recipient is resolved on the server from the role, never taken from the
 * request: the screen offers exactly one destination, so accepting a recipient
 * id would let any signed-in account message any other.
 */
export async function messageForgeManager(user, input) {
  // `subject` is VARCHAR(255). Checking the length here rather than letting
  // MySQL decide is what makes the outcome the same on every server: without
  // strict mode the column silently truncates, with it the driver raises a
  // 500. Either way the sender is never told their subject was too long.
  const check = validator()
  const subject = check.text('subject', input?.subject, {
    required: true,
    max: LIMITS.subject,
    label: 'Subject',
  })
  const body = check.text('message', input?.message ?? input?.body, {
    required: true,
    label: 'Message',
  })
  check.throwIfInvalid()

  const directory = await studentsService.listAll()
  const manager = directory.find((row) => (row.roleSlugs ?? []).includes('forge-manager'))
  if (!manager) throw new NotFoundError('Forge Manager')

  const messageId = await platformService.sendMessage({
    senderId: user.id,
    recipientId: manager.id,
    subject,
    body,
  })

  return { messageId, recipient: manager.name }
}

/**
 * The caller's own notifications.
 *
 * Every role has the bell in its navbar, so this is assembled once rather than
 * five times. The user id comes from the session — `findNotifications` takes it
 * as its only argument, so a caller cannot ask for somebody else's.
 */
export async function getNotifications(user, page = null) {
  const [notifications, unread, total] = await Promise.all([
    platformService.listNotifications(user.id, {
      limit: page?.limit ?? null,
      offset: page?.offset ?? null,
    }),
    platformService.unreadCount(user.id),
    platformService.countNotifications(user.id),
  ])

  return {
    unread,
    total,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      href: notification.linkUrl,
      isRead: notification.isRead,
      meta: dayTimeLabel(notification.createdAt),
    })),
  }
}

/**
 * Mark one notification read.
 *
 * The repository scopes the update by user id, so a notification belonging to
 * somebody else simply matches no rows. That is reported as 404 rather than
 * 403: confirming the id exists would leak that another account was notified.
 */
export async function readNotification(user, notificationId) {
  const id = Number(notificationId)
  if (!Number.isInteger(id) || id < 1) throw new ValidationError('Unknown notification.')

  const updated = await platformService.markNotificationRead(id, user.id)
  if (!updated) throw new NotFoundError('Notification')

  return { id, read: true }
}

/**
 * Messages the caller sent or received — the other half of Contact Forge
 * Manager, in both directions.
 *
 * A page applies to each direction separately — they are two lists in one
 * payload — and `total` is their combined size, which is what a caller wanting
 * to know "how much is there" is actually asking.
 */
export async function getMessages(user, page = null) {
  const window = { limit: page?.limit ?? null, offset: page?.offset ?? null }
  const [received, sent, receivedTotal, sentTotal] = await Promise.all([
    platformService.listMessages({ recipientId: user.id, ...window }),
    platformService.listMessages({ senderId: user.id, ...window }),
    platformService.countMessages({ recipientId: user.id }),
    platformService.countMessages({ senderId: user.id }),
  ])

  const shape = (message) => ({
    id: message.id,
    subject: message.subject,
    body: message.body,
    isRead: message.isRead,
    meta: dayTimeLabel(message.sentAt),
    from: message.senderName,
    to: message.recipientName,
  })

  return {
    received: received.map(shape),
    sent: sent.map(shape),
    total: receivedTotal + sentTotal,
  }
}

/**
 * The status history of one application.
 *
 * Readable by the applicant and by whoever posted the listing — the two people
 * the pipeline concerns. Anyone else gets 404, because confirming that an
 * application id exists would leak who applied where.
 */
export async function getApplicationHistory(user, applicationId) {
  const id = Number(applicationId)
  if (!Number.isInteger(id) || id < 1) throw new ValidationError('Unknown application.')

  const application = await applicationsService.getById(id)
  if (!application) throw new NotFoundError('Application')

  const isApplicant = application.applicant.id === user.id
  if (!isApplicant) {
    const listing = await listingsService.getById(application.listing.id)
    if (listing?.createdBy?.id !== user.id) throw new NotFoundError('Application')
  }

  const events = await applicationsService.getHistory(id)

  return {
    applicationId: id,
    status: application.status,
    history: events.map((event) => ({
      id: event.id,
      from: event.fromStatus,
      to: event.toStatus,
      note: event.note,
      by: event.changedBy,
      meta: dayTimeLabel(event.createdAt),
    })),
  }
}

/**
 * Change the caller's own password.
 *
 * The current password is re-checked by the service even though the caller
 * holds a valid session: a session proves who opened the browser, not who is
 * sitting at it now.
 */
export async function changeOwnPassword(user, input) {
  const current = String(input?.currentPassword ?? '')
  const next = String(input?.newPassword ?? '')
  const confirm = String(input?.confirmPassword ?? next)

  if (!current) throw new ValidationError('Enter your current password.')
  if (next !== confirm) throw new ValidationError('The new passwords do not match.')
  if (next === current) throw new ValidationError('Choose a password you have not used here.')

  await authService.changePassword(user.id, current, next)

  await platformService.logActivity({
    actorUserId: user.id,
    action: 'Changed account password',
    module: 'Account',
    entityType: 'user',
    entityId: user.id,
    status: 'success',
  })

  return { changed: true }
}

