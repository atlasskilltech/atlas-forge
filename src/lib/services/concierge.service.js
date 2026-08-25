import 'server-only'

import { transaction } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'
import * as concierge from '@/lib/repositories/concierge.repository'
import * as platform from '@/lib/repositories/platform.repository'
import * as users from '@/lib/repositories/users.repository'
import { getSettingsMap } from './lookups.service'

/**
 * Concierge — the founder→student outreach channel.
 *
 * Every screen states that the Forge Manager is CC'd on all outreach. That is
 * enforced here from the `contact_log_auto_cc` platform setting, not left to
 * whichever caller happens to remember it.
 */

export const listContacts = (filters) => concierge.findContacts(filters)
export const contactStats = (filters) => concierge.contactStats(filters)
export const listPostedNeeds = (filters) => concierge.findPostedNeeds(filters)

export function searchPool({ track = null, availableOnly = null } = {}) {
  return users.findStudentPool({ track, availableOnly })
}

/** Resolves the Forge Manager who should be CC'd, or null if CC is disabled. */
async function resolveCcUserId() {
  const settings = await getSettingsMap()
  if (settings.contact_log_auto_cc === false) return null

  const managers = await users.findAll()
  const manager = managers.find((user) => user.primaryRoleSlug === 'forge-manager')
  return manager?.id ?? null
}

export async function contactStudent({
  founderId,
  studentId,
  startupId = null,
  context,
  durationLabel = null,
  message = null,
}) {
  if (!context?.trim()) throw new ValidationError('Describe what the engagement is for.')

  const student = await users.findById(studentId)
  if (!student) throw new NotFoundError('Student')

  const ccUserId = await resolveCcUserId()

  return transaction(async (tx) => {
    const contactId = await concierge.createContact(
      { founderId, studentId, startupId, context: context.trim(), durationLabel, message, ccUserId },
      tx
    )

    await platform.logActivity(
      {
        actorUserId: founderId,
        action: `Contacted ${student.name} via Service`,
        module: 'Service',
        entityType: 'concierge_contact',
        entityId: contactId,
        status: 'logged',
      },
      tx
    )

    await platform.createNotification(
      {
        userId: studentId,
        type: 'concierge',
        title: 'A founder contacted you',
        body: context.trim(),
        linkUrl: '/student/home',
        entityType: 'concierge_contact',
        entityId: contactId,
      },
      tx
    )

    return contactId
  })
}

export function updateContactStatus(contactId, status) {
  if (!['pending', 'ongoing', 'done'].includes(status)) {
    throw new ValidationError(`Unknown contact status: ${status}`)
  }
  return concierge.updateContactStatus(contactId, status)
}

export async function postNeed({ founderId, startupId = null, title, description = null }) {
  if (!title?.trim()) throw new ValidationError('A title is required.')

  return transaction(async (tx) => {
    const needId = await concierge.createPostedNeed(
      { founderId, startupId, title: title.trim(), description },
      tx
    )
    await platform.logActivity(
      {
        actorUserId: founderId,
        action: `Posted a talent need: ${title.trim()}`,
        module: 'Service',
        entityType: 'posted_need',
        entityId: needId,
        status: 'logged',
      },
      tx
    )
    return needId
  })
}
