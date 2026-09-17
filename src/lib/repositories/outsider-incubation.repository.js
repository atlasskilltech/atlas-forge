import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/outsider-incubation'
import { iso, num, pair } from '@/lib/utils/rows'

/**
 * Public incubation applications.
 *
 * Repositories own row → domain mapping. Callers pass camelCase and never see
 * a column name.
 */

export const toOutsiderApplication = (row) => ({
  id: num(row.id),
  reference: row.reference,
  applicant: {
    name: row.full_name,
    email: row.email,
    phone: row.phone,
  },
  startupName: row.startup_name,
  tagline: row.tagline ?? null,
  problemStatement: row.problem_statement ?? null,
  logoUrl: row.startup_logo_url ?? null,
  industry: row.industry_id
    ? { id: num(row.industry_id), name: row.industry_name, slug: row.industry_slug }
    : null,
  stage: row.stage_id ? { id: num(row.stage_id), name: row.stage_name, slug: row.stage_slug } : null,
  readiness: {
    pitchDeck: row.pitch_deck,
    productDemo: row.product_demo ?? null,
    productAssets: row.product_assets ?? null,
    keyPersonnel: row.key_personnel,
  },
  status: row.status,
  reviewer: row.reviewed_by ? { id: num(row.reviewed_by), name: row.reviewer_name } : null,
  reviewedAt: iso(row.reviewed_at),
  rejectionReason: row.rejection_reason ?? null,
  approved: {
    userId: num(row.approved_user_id),
    appId: row.approved_user_app_id ?? null,
    startupId: num(row.approved_startup_id),
    startupSlug: row.approved_startup_slug ?? null,
    incubationApplicationId: num(row.incubation_application_id),
  },
  existingAccount: row.matched_user_id
    ? { id: num(row.matched_user_id), appId: row.matched_user_app_id, name: row.matched_user_name }
    : null,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

export async function findAll({ status = null } = {}) {
  const rows = await query(sql.SELECT_OUTSIDER_APPLICATIONS, [...pair(status)])
  return rows.map(toOutsiderApplication)
}

export async function findById(id) {
  const row = await queryOne(sql.SELECT_OUTSIDER_APPLICATION, [id])
  return row ? toOutsiderApplication(row) : null
}

export function create(data, conn) {
  return insert(
    sql.INSERT_OUTSIDER_APPLICATION,
    [
      data.reference,
      data.fullName,
      data.email,
      data.phone,
      data.startupName,
      data.tagline ?? null,
      data.problemStatement ?? null,
      data.industryId ?? null,
      data.stageId ?? null,
      data.logoUrl ?? null,
      data.pitchDeck,
      data.productDemo ?? null,
      data.productAssets ?? null,
      data.keyPersonnel,
      data.sourceIp ?? '',
      data.userAgent ?? null,
    ],
    conn
  )
}

/** True when this call moved the row from 'pending' to 'approved'. */
export async function claimForApproval(id, reviewerId, conn) {
  const { affectedRows } = await execute(sql.CLAIM_FOR_APPROVAL, [reviewerId, id], conn)
  return affectedRows > 0
}

export async function linkApproval(id, { userId, startupId, incubationApplicationId }, conn) {
  await execute(sql.LINK_APPROVAL, [userId, startupId, incubationApplicationId, id], conn)
}

/** True when this call moved the row from 'pending' to 'rejected'. */
export async function reject(id, reviewerId, reason, conn) {
  const { affectedRows } = await execute(
    sql.REJECT_OUTSIDER_APPLICATION,
    [reviewerId, reason, id],
    conn
  )
  return affectedRows > 0
}

const count = async (statement, params) => Number((await queryValue(statement, params)) ?? 0)

export const countPendingByEmail = (email) => count(sql.COUNT_PENDING_BY_EMAIL, [email])

export const countRecentByIp = (ip, windowSeconds) =>
  count(sql.COUNT_RECENT_BY_IP, [ip, windowSeconds])

export async function findUserByEmail(email) {
  const row = await queryOne(sql.SELECT_USER_BY_EMAIL, [email])
  return row
    ? {
        id: num(row.id),
        appId: row.app_id,
        name: row.full_name,
        status: row.status,
        isDeleted: Boolean(row.deleted_at),
      }
    : null
}
