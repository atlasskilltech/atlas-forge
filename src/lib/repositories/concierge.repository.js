import 'server-only'

import { execute, insert, query, queryOne } from '@/lib/db'
import * as sql from '@/lib/queries/concierge'
import { applyFullListCap, withFullListCap } from '@/lib/queries/pagination'
import { iso, num, pair } from '@/lib/utils/rows'

export const toContact = (row) => ({
  id: num(row.id),
  context: row.context,
  durationLabel: row.duration_label,
  message: row.message,
  status: row.status,
  contactedAt: iso(row.contacted_at),
  founder: { id: num(row.founder_id), name: row.founder_name, initials: row.founder_initials },
  student: {
    id: num(row.student_id),
    name: row.student_name,
    appId: row.student_app_id,
    initials: row.student_initials,
    avatarTone: row.student_tone,
  },
  ccName: row.cc_name,
  startup: row.startup_name ? { name: row.startup_name, slug: row.startup_slug } : null,
})

const toNeed = (row) => ({
  id: num(row.id),
  title: row.title,
  description: row.description,
  status: row.status,
  postedAt: iso(row.posted_at),
  founderName: row.founder_name,
  startup: row.startup_name ? { name: row.startup_name, slug: row.startup_slug } : null,
})

export async function findContacts({ founderId = null, studentId = null, status = null } = {}) {
  const rows = await query(withFullListCap(sql.SELECT_CONTACTS), [
    ...pair(founderId),
    ...pair(studentId),
    ...pair(status),
  ])
  return applyFullListCap(rows, 'concierge contacts').map(toContact)
}

export async function createContact(data, conn) {
  return insert(
    sql.INSERT_CONTACT,
    [
      data.founderId,
      data.studentId,
      data.startupId ?? null,
      data.context,
      data.durationLabel ?? null,
      data.message ?? null,
      data.ccUserId ?? null,
    ],
    conn
  )
}

export async function updateContactStatus(contactId, status, conn) {
  const { affectedRows } = await execute(sql.UPDATE_CONTACT_STATUS, [status, contactId], conn)
  return affectedRows > 0
}

export async function contactStats({ founderId = null } = {}) {
  const row = await queryOne(sql.COUNT_CONTACT_STATS, [...pair(founderId)])
  return {
    total: num(row?.total) ?? 0,
    thisWeek: num(row?.this_week) ?? 0,
    ongoing: num(row?.ongoing) ?? 0,
    completed: num(row?.completed) ?? 0,
  }
}

export async function findPostedNeeds({ founderId = null } = {}) {
  const rows = await query(withFullListCap(sql.SELECT_POSTED_NEEDS), [...pair(founderId)])
  return applyFullListCap(rows, 'posted needs').map(toNeed)
}

export async function createPostedNeed(data, conn) {
  return insert(
    sql.INSERT_POSTED_NEED,
    [data.founderId, data.startupId ?? null, data.title, data.description ?? null],
    conn
  )
}
