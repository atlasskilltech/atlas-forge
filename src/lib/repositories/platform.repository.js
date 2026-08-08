import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/platform'
import { applyFullListCap } from '@/lib/queries/pagination'
import { iso, json, num, pair } from '@/lib/utils/rows'

/**
 * `meta` and `context` are declared JSON. On MySQL 8 the driver returns them
 * parsed; on MariaDB the type is a LONGTEXT alias and they arrive as strings.
 * `json()` normalises both, so callers always receive an object.
 */

const toActivity = (row) => ({
  id: num(row.id),
  action: row.action,
  module: row.module,
  entityType: row.entity_type,
  entityId: num(row.entity_id),
  status: row.status,
  meta: json(row.meta),
  createdAt: iso(row.created_at),
  actor: row.actor_name
    ? { name: row.actor_name, initials: row.actor_initials, avatarTone: row.actor_tone }
    : null,
})

const toError = (row) => ({
  id: num(row.id),
  level: row.level,
  message: row.message,
  context: json(row.context),
  resolvedAt: iso(row.resolved_at),
  createdAt: iso(row.created_at),
  userName: row.user_name,
})

const toNotification = (row) => ({
  id: num(row.id),
  type: row.type,
  title: row.title,
  body: row.body,
  linkUrl: row.link_url,
  entityType: row.entity_type,
  entityId: num(row.entity_id),
  isRead: Boolean(row.read_at),
  readAt: iso(row.read_at),
  createdAt: iso(row.created_at),
})

const toMessage = (row) => ({
  id: num(row.id),
  subject: row.subject,
  body: row.body,
  isRead: Boolean(row.read_at),
  sentAt: iso(row.sent_at),
  senderName: row.sender_name,
  senderInitials: row.sender_initials,
  recipientName: row.recipient_name,
})

const toContract = (row) => ({
  id: num(row.id),
  title: row.title,
  terms: row.terms,
  status: row.status,
  startedAt: iso(row.started_at),
  endedAt: iso(row.ended_at),
  createdAt: iso(row.created_at),
  founderName: row.founder_name,
  studentName: row.student_name,
  startupName: row.startup_name,
  listingTitle: row.listing_title,
})

export async function findActivity({ module = null, actorId = null, limit = null, offset = null } = {}) {
  const rows = await query(sql.selectActivityLogs({ limit, offset }), [
    ...pair(module),
    ...pair(actorId),
  ])
  return applyFullListCap(rows, 'activity log').map(toActivity)
}

/** Total matching the same filters, for the page headers. */
export async function countActivity({ module = null, actorId = null } = {}) {
  return num(await queryValue(sql.COUNT_ACTIVITY_LOGS, [...pair(module), ...pair(actorId)])) ?? 0
}

/** Activity concerning one startup, by anyone — see `selectStartupActivity`. */
export async function findStartupActivity({ actorId, startupId = null, limit = null, offset = null } = {}) {
  const rows = await query(sql.selectStartupActivity({ limit, offset }), [
    actorId,
    startupId,
    startupId,
    startupId,
    startupId,
  ])
  return rows.map(toActivity)
}

export async function logActivity(data, conn) {
  return insert(
    sql.INSERT_ACTIVITY_LOG,
    [
      data.actorUserId ?? null,
      data.action,
      data.module,
      data.entityType ?? null,
      data.entityId ?? null,
      data.status ?? 'logged',
      data.meta ? JSON.stringify(data.meta) : null,
    ],
    conn
  )
}

export async function findErrors({ limit = null, offset = null } = {}) {
  const rows = await query(sql.selectErrorLogs({ limit, offset }))
  return applyFullListCap(rows, 'error log').map(toError)
}

export async function countErrors() {
  return num(await queryValue(sql.COUNT_ERROR_LOGS)) ?? 0
}

export async function logError(data, conn) {
  return insert(
    sql.INSERT_ERROR_LOG,
    [
      data.level ?? 'error',
      data.message,
      data.stackTrace ?? null,
      data.context ? JSON.stringify(data.context) : null,
      data.userId ?? null,
    ],
    conn
  )
}

export async function countUnresolvedErrors() {
  return num(await queryValue(sql.COUNT_UNRESOLVED_ERRORS)) ?? 0
}

export async function findNotifications(userId, { limit = null, offset = null } = {}) {
  const rows = await query(sql.selectNotifications({ limit, offset }), [userId])
  return applyFullListCap(rows, 'notifications').map(toNotification)
}

export async function countNotifications(userId) {
  return num(await queryValue(sql.COUNT_NOTIFICATIONS, [userId])) ?? 0
}

export async function countUnread(userId) {
  return num(await queryValue(sql.COUNT_UNREAD_NOTIFICATIONS, [userId])) ?? 0
}

export async function createNotification(data, conn) {
  return insert(
    sql.INSERT_NOTIFICATION,
    [
      data.userId,
      data.type,
      data.title,
      data.body ?? null,
      data.linkUrl ?? null,
      data.entityType ?? null,
      data.entityId ?? null,
    ],
    conn
  )
}

export async function markNotificationRead(notificationId, userId, conn) {
  const { affectedRows } = await execute(
    sql.MARK_NOTIFICATION_READ,
    [notificationId, userId],
    conn
  )
  return affectedRows > 0
}

export async function findMessages({ recipientId = null, senderId = null, limit = null, offset = null } = {}) {
  const rows = await query(sql.selectMessages({ limit, offset }), [
    ...pair(recipientId),
    ...pair(senderId),
  ])
  return applyFullListCap(rows, 'messages').map(toMessage)
}

export async function countMessages({ recipientId = null, senderId = null } = {}) {
  return (
    num(await queryValue(sql.COUNT_MESSAGES, [...pair(recipientId), ...pair(senderId)])) ?? 0
  )
}

export async function createMessage(data, conn) {
  return insert(
    sql.INSERT_MESSAGE,
    [data.senderId, data.recipientId, data.subject, data.body],
    conn
  )
}

export async function findContracts({ founderId = null, studentId = null } = {}) {
  const rows = await query(sql.SELECT_CONTRACTS, [...pair(founderId), ...pair(studentId)])
  return rows.map(toContract)
}

/** Every dashboard counter in a single round trip. */
export async function platformStats() {
  const row = await queryOne(sql.SELECT_PLATFORM_STATS)
  return Object.fromEntries(Object.entries(row ?? {}).map(([key, value]) => [key, num(value) ?? 0]))
}
