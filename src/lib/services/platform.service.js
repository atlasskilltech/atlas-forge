import 'server-only'

import { execute, transaction } from '@/lib/db'
import { ValidationError } from '@/lib/errors'
import * as platform from '@/lib/repositories/platform.repository'
import * as lookups from '@/lib/repositories/lookups.repository'
import { clearCache } from './lookups.service'

/**
 * Platform operations: settings, audit trail, notifications, messages and the
 * shared dashboard counters.
 */

export const listActivity = (filters) => platform.findActivity(filters)
export const listStartupActivity = (filters) => platform.findStartupActivity(filters)
export const listErrors = (page) => platform.findErrors(page)
export const listContracts = (filters) => platform.findContracts(filters)
export const listNotifications = (userId, page) => platform.findNotifications(userId, page)
export const unreadCount = (userId) => platform.countUnread(userId)
export const listMessages = (filters) => platform.findMessages(filters)

/**
 * Totals for the paged lists, so a caller can report "20 of 340" without
 * fetching 340 rows to count them.
 */
export const countActivity = (filters) => platform.countActivity(filters)
export const countErrors = () => platform.countErrors()
export const countNotifications = (userId) => platform.countNotifications(userId)
export const countMessages = (filters) => platform.countMessages(filters)
export const stats = () => platform.platformStats()

export const logActivity = (data) => platform.logActivity(data)
export const logError = (data) => platform.logError(data)
export const markNotificationRead = (id, userId) => platform.markNotificationRead(id, userId)

export async function getSettingsByGroup() {
  const settings = await lookups.findAllSettings()
  const groups = new Map()
  for (const setting of settings) {
    if (!groups.has(setting.group)) groups.set(setting.group, [])
    groups.get(setting.group).push(setting)
  }
  return [...groups.entries()].map(([key, items]) => ({ key, settings: items }))
}

/**
 * Change a platform setting. Writes the change to the audit trail and clears
 * the lookup cache so the new value takes effect immediately.
 */
export async function updateSetting({ key, value, actorId }) {
  const setting = await lookups.findSetting(key)
  if (!setting) throw new ValidationError(`Unknown setting: ${key}`)

  const result = await transaction(async (tx) => {
    await lookups.updateSetting(key, value, actorId, tx)
    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Changed platform setting "${setting.label}" to ${value}`,
        module: 'Platform',
        entityType: 'platform_setting',
        entityId: setting.id,
        status: 'success',
      },
      tx
    )
    return true
  })

  clearCache()
  return result
}

/**
 * The Danger Zone action on Platform Settings.
 *
 * Scope is deliberately exactly what the confirmation dialog promises — "job
 * listings, applications, contact logs, and activity records" — and nothing
 * else. Startups, incubation applications, founder grants, mentorship, every
 * user account and all reference data survive, because the dialog tells the
 * administrator they will. A destructive action that clears more than it says
 * it does is worse than one that clears too little.
 *
 * Children are removed before parents so the foreign keys never have to decide
 * for us, and the whole thing is one transaction: a half-cleared platform is
 * not a state anyone can reason about.
 */
const RESET_STATEMENTS = [
  'DELETE FROM application_events',
  'DELETE FROM applications',
  'DELETE FROM approvals',
  'DELETE FROM listing_skills',
  'DELETE FROM listings',
  'DELETE FROM concierge_contacts',
  'DELETE FROM posted_needs',
  'DELETE FROM notifications',
  'DELETE FROM error_logs',
  'DELETE FROM activity_logs',
]

export async function resetPlatformData({ actorId }) {
  const cleared = await transaction(async (tx) => {
    let rows = 0
    for (const statement of RESET_STATEMENTS) {
      const { affectedRows } = await execute(statement, [], tx)
      rows += affectedRows
    }

    // Logged after the activity table is emptied, so the reset itself is the
    // first entry in the new trail rather than being deleted by its own run.
    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Reset platform data — ${rows} records cleared`,
        module: 'Platform',
        entityType: 'platform',
        status: 'action',
      },
      tx
    )

    return rows
  })

  return { cleared }
}

export async function sendMessage({ senderId, recipientId, subject, body }) {
  if (!subject?.trim() || !body?.trim()) {
    throw new ValidationError('A subject and message are required.')
  }

  return transaction(async (tx) => {
    const messageId = await platform.createMessage(
      { senderId, recipientId, subject: subject.trim(), body: body.trim() },
      tx
    )
    await platform.createNotification(
      {
        userId: recipientId,
        type: 'message',
        title: 'New message',
        body: subject.trim(),
        entityType: 'message',
        entityId: messageId,
      },
      tx
    )
    return messageId
  })
}
