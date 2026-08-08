import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/incubation'
import { iso, num, pair } from '@/lib/utils/rows'

export const toApplication = (row) => ({
  id: num(row.id),
  ideaName: row.idea_name,
  problemStatement: row.problem_statement,
  teamMemberIds: row.team_member_ids,
  status: row.status,
  completionPct: num(row.completion_pct) ?? 0,
  submittedAt: iso(row.submitted_at),
  reviewedAt: iso(row.reviewed_at),
  createdAt: iso(row.created_at),
  stage: row.stage_name ? { name: row.stage_name, slug: row.stage_slug } : null,
  applicant: {
    id: num(row.applicant_id),
    name: row.applicant_name,
    initials: row.applicant_initials,
  },
  startup: row.startup_id
    ? { id: num(row.startup_id), name: row.startup_name, slug: row.startup_slug }
    : null,
  reviewerName: row.reviewer_name,
})

const toReadinessItem = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  hint: row.hint,
  value: row.value ?? null,
  isComplete: Boolean(row.value && String(row.value).trim()),
})

const toGrant = (row) => ({
  id: num(row.id),
  grantedAt: iso(row.granted_at),
  revokedAt: iso(row.revoked_at),
  reason: row.reason,
  isActive: !row.revoked_at,
  user: {
    id: num(row.user_id),
    name: row.full_name,
    appId: row.app_id,
    initials: row.initials,
    avatarTone: row.avatar_tone,
  },
  startup: row.startup_name ? { name: row.startup_name, slug: row.startup_slug } : null,
  grantedByName: row.granted_by_name,
  revokedByName: row.revoked_by_name,
})

export async function findApplications({ applicantId = null, status = null } = {}) {
  const rows = await query(sql.SELECT_INCUBATION_APPLICATIONS, [
    ...pair(applicantId),
    ...pair(status),
  ])
  return rows.map(toApplication)
}

export async function findApplicationById(id) {
  const row = await queryOne(sql.SELECT_INCUBATION_APPLICATION, [id])
  return row ? toApplication(row) : null
}

/**
 * The readiness checklist. Returns every active item — filled or not — so the
 * caller can compute the ring as complete/total without a second query.
 */
export async function findReadiness(applicationId) {
  const rows = await query(sql.SELECT_APPLICATION_READINESS, [applicationId])
  const items = rows.map(toReadinessItem)
  const complete = items.filter((item) => item.isComplete).length
  return {
    items,
    complete,
    total: items.length,
    percent: items.length === 0 ? 0 : Math.round((complete / items.length) * 100),
  }
}

export async function createApplication(data, conn) {
  return insert(
    sql.INSERT_INCUBATION_APPLICATION,
    [
      data.applicantId,
      data.startupId ?? null,
      data.ideaName,
      data.problemStatement ?? null,
      data.stageId ?? null,
      data.teamMemberIds ?? null,
      data.status ?? 'draft',
      data.completionPct ?? 0,
      data.submittedAt ?? null,
    ],
    conn
  )
}

export async function setReadinessValue(applicationId, readinessItemId, value, conn) {
  await execute(sql.UPSERT_READINESS_VALUE, [applicationId, readinessItemId, value], conn)
}

export async function review(applicationId, status, reviewedBy, conn) {
  const { affectedRows } = await execute(
    sql.UPDATE_APPLICATION_REVIEW,
    [status, reviewedBy, applicationId],
    conn
  )
  return affectedRows > 0
}

export async function updateCompletion(applicationId, percent, conn) {
  await execute(sql.UPDATE_COMPLETION_PCT, [percent, applicationId], conn)
}

export async function findGrants({ userId = null } = {}) {
  const rows = await query(sql.SELECT_FOUNDER_GRANTS, [...pair(userId)])
  return rows.map(toGrant)
}

export async function createGrant(data, conn) {
  return insert(
    sql.INSERT_FOUNDER_GRANT,
    [data.userId, data.startupId ?? null, data.applicationId ?? null, data.grantedBy, data.reason ?? null],
    conn
  )
}

export async function revokeGrant(grantId, revokedBy, reason = null, conn) {
  const { affectedRows } = await execute(
    sql.REVOKE_FOUNDER_GRANT,
    [revokedBy, reason, grantId],
    conn
  )
  return affectedRows > 0
}

export async function countPending() {
  return num(await queryValue(sql.COUNT_PENDING_APPLICATIONS)) ?? 0
}
