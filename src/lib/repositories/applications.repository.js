import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/applications'
import { applyFullListCap, withFullListCap } from '@/lib/queries/pagination'
import { iso, num, pair } from '@/lib/utils/rows'

export const toApplication = (row) => ({
  id: num(row.id),
  status: row.status,
  coverNote: row.cover_note,
  appliedAt: iso(row.applied_at),
  updatedAt: iso(row.updated_at),
  listing: {
    id: num(row.listing_id),
    title: row.listing_title,
    type: row.listing_type,
    typeName: row.listing_type_name,
  },
  startup: row.startup_id
    ? {
        id: num(row.startup_id),
        name: row.startup_name,
        initial: row.startup_initial,
        avatarTone: row.startup_tone,
      }
    : null,
  applicant: {
    id: num(row.applicant_id),
    name: row.applicant_name,
    appId: row.applicant_app_id,
    initials: row.applicant_initials,
    avatarTone: row.applicant_tone,
  },
})

const toEvent = (row) => ({
  id: num(row.id),
  fromStatus: row.from_status,
  toStatus: row.to_status,
  note: row.note,
  changedBy: row.changed_by_name,
  createdAt: iso(row.created_at),
})

const toApplicant = (row) => ({
  applicationId: num(row.id),
  status: row.status,
  appliedAt: iso(row.applied_at),
  id: num(row.user_id),
  name: row.full_name,
  appId: row.app_id,
  initials: row.initials,
  avatarTone: row.avatar_tone,
  programme: row.programme,
  yearOfStudy: num(row.year_of_study),
})

export async function findAll({
  applicantId = null,
  listingId = null,
  startupId = null,
  status = null,
} = {}) {
  const rows = await query(withFullListCap(sql.SELECT_APPLICATIONS), [
    ...pair(applicantId),
    ...pair(listingId),
    ...pair(startupId),
    ...pair(status),
  ])
  return applyFullListCap(rows, 'applications').map(toApplication)
}

export async function findById(id) {
  const row = await queryOne(sql.SELECT_APPLICATION_BY_ID, [id])
  return row ? toApplication(row) : null
}

export async function findEvents(applicationId) {
  const rows = await query(sql.SELECT_APPLICATION_EVENTS, [applicationId])
  return rows.map(toEvent)
}

export async function findApplicantsForListing(listingId) {
  const rows = await query(sql.SELECT_APPLICANTS_FOR_LISTING, [listingId])
  return rows.map(toApplicant)
}

export async function create({ listingId, applicantId, coverNote = null }, conn) {
  return insert(sql.INSERT_APPLICATION, [listingId, applicantId, coverNote], conn)
}

export async function updateStatus(applicationId, status, conn) {
  const { affectedRows } = await execute(sql.UPDATE_APPLICATION_STATUS, [status, applicationId], conn)
  return affectedRows > 0
}

export async function recordEvent(
  { applicationId, fromStatus = null, toStatus, changedBy = null, note = null },
  conn
) {
  return insert(
    sql.INSERT_APPLICATION_EVENT,
    [applicationId, fromStatus, toStatus, changedBy, note],
    conn
  )
}

export async function countActiveForUser(userId) {
  return num(await queryValue(sql.COUNT_APPLICATIONS_FOR_USER, [userId])) ?? 0
}
