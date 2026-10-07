import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/registration'
import { bool, iso, num, pair } from '@/lib/utils/rows'

/**
 * Public network-registration requests.
 *
 * Repositories own row → domain mapping. Callers pass camelCase and never see
 * a column name. The row starts life as `status = 'pending'`; nothing else in
 * the system is written until a Forge Manager reviews it (Phases 5–6).
 */

/** Role-specific answers are stored as a JSON string; a bad parse yields {}. */
function parseDetails(value) {
  if (!value) return {}
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

export const toRegistration = (row) => ({
  id: num(row.id),
  reference: row.reference,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone ?? null,
  roleCategory: row.role_category,
  details: parseDetails(row.details_json),
  consent: Boolean(row.consent),
  consentedAt: iso(row.consented_at),
  status: row.status,
  reviewer: row.reviewed_by ? { id: num(row.reviewed_by), name: row.reviewer_name } : null,
  reviewedAt: iso(row.reviewed_at),
  rejectionReason: row.rejection_reason ?? null,
  approved: {
    userId: num(row.approved_user_id),
    appId: row.approved_user_app_id ?? null,
    mustChangePassword: bool(row.approved_user_must_change),
    roleId: num(row.approved_role_id),
    roleName: row.approved_role_name ?? null,
  },
  existingAccount: row.matched_user_id
    ? {
        id: num(row.matched_user_id),
        appId: row.matched_user_app_id,
        name: row.matched_user_name,
        status: row.matched_user_status,
      }
    : null,
  createdAt: iso(row.created_at),
  updatedAt: iso(row.updated_at),
})

export function create({
  reference,
  fullName,
  email,
  phone = null,
  roleCategory,
  details = {},
  consent = false,
  sourceIp = '',
  userAgent = null,
}) {
  return insert(sql.INSERT_REGISTRATION_REQUEST, [
    reference,
    fullName,
    email,
    phone,
    roleCategory,
    JSON.stringify(details ?? {}),
    consent ? 1 : 0,
    consent ? new Date() : null,
    sourceIp,
    userAgent,
  ])
}

/** `COUNT(*)` comes back as a number already — `queryValue` returns the scalar. */
const count = async (statement, params) => Number((await queryValue(statement, params)) ?? 0)

export const countPendingByEmail = (email) => count(sql.COUNT_PENDING_BY_EMAIL, [email])

export const countRecentByIp = (ip, windowSeconds) =>
  count(sql.COUNT_RECENT_BY_IP, [ip, windowSeconds])

/* -------------------------------------------------------------------------- */
/* Forge Manager review                                                       */
/* -------------------------------------------------------------------------- */

export async function findAll({ status = null } = {}) {
  const rows = await query(sql.SELECT_REGISTRATIONS, [...pair(status)])
  return rows.map(toRegistration)
}

export async function findById(id) {
  const row = await queryOne(sql.SELECT_REGISTRATION, [id])
  return row ? toRegistration(row) : null
}

/** True when this call moved the row from 'pending' to 'approved'. */
export async function claimForApproval(id, reviewerId, conn) {
  const { affectedRows } = await execute(sql.CLAIM_FOR_APPROVAL, [reviewerId, id], conn)
  return affectedRows > 0
}

/** True when this call moved the row from 'pending' to 'rejected'. */
export async function reject(id, reviewerId, reason, conn) {
  const { affectedRows } = await execute(sql.REJECT_REGISTRATION, [reviewerId, reason, id], conn)
  return affectedRows > 0
}

/** Records the user and role an approval created or attached to. */
export async function linkApproval(id, { userId, roleId }, conn) {
  await execute(sql.LINK_APPROVAL, [userId, roleId, id], conn)
}

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
