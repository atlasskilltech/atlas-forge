import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import { withPagination } from '@/lib/queries/pagination'
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
  // University Student Application ID (Atlas Student only; NULL otherwise).
  studentApplicationId: row.student_application_id ?? null,
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
  studentApplicationId = null,
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
    studentApplicationId,
    JSON.stringify(details ?? {}),
    consent ? 1 : 0,
    consent ? new Date() : null,
    sourceIp,
    userAgent,
  ])
}

/** `COUNT(*)` comes back as a number already — `queryValue` returns the scalar. */
const count = async (statement, params) => Number((await queryValue(statement, params)) ?? 0)

/* -------------------------------------------------------------------------- */
/* Public read-only API                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The safe-subset row shape for the public API. Mirrors exactly the columns
 * SELECT_PUBLIC_REGISTRATIONS returns — no phone, no details, no audit fields,
 * and no internal id. Kept separate from `toRegistration` so the public path
 * can never accidentally inherit a sensitive field added to the full mapper.
 */
const toPublicRegistration = (row) => ({
  reference: row.reference,
  fullName: row.full_name,
  email: row.email,
  roleCategory: row.role_category,
  status: row.status,
  createdAt: iso(row.created_at),
})

/** A page of public registrations, newest first, optionally filtered by status. */
export async function findPublic({ status = null, limit = null, offset = null } = {}) {
  const statement = withPagination(sql.SELECT_PUBLIC_REGISTRATIONS, { limit, offset })
  const rows = await query(statement, [...pair(status)])
  return rows.map(toPublicRegistration)
}

/** Total public registrations matching the same optional status filter. */
export const countPublic = ({ status = null } = {}) =>
  count(sql.COUNT_PUBLIC_REGISTRATIONS, [...pair(status)])

/**
 * The safe lookup-row shape: the student's registration plus the ATLAS Forge
 * account approval created, if any. No phone, details, IP, reviewer, audit or
 * internal numeric id — only Forge-facing identifiers and lifecycle flags.
 */
const toStudentLookupRow = (row) => ({
  reference: row.reference,
  studentApplicationId: row.student_application_id,
  roleCategory: row.role_category,
  status: row.status,
  createdAt: iso(row.created_at),
  // Internal: used by the service to join incubation participation, then
  // dropped — it never reaches the public response.
  approvedUserId: row.approved_user_id && !row.account_deleted_at ? num(row.approved_user_id) : null,
  account:
    row.approved_user_id && !row.account_deleted_at
      ? {
          appId: row.account_app_id ?? null,
          status: row.account_status ?? null,
          mustChangePassword: bool(row.account_must_change),
        }
      : null,
})

/**
 * Every Atlas Student registration whose stored University Student Application
 * ID matches exactly. Returns an array because the column is not unique; the
 * service decides how to treat zero / one / many. Parameterised; read-only.
 */
export async function findStudentByApplicationId(applicationId) {
  const rows = await query(sql.SELECT_STUDENT_BY_APPLICATION_ID, [applicationId])
  return rows.map(toStudentLookupRow)
}

/** The most recent non-deleted incubation application status for a user, or null. */
export async function findLatestIncubationStatusByUserId(userId) {
  const row = await queryOne(sql.SELECT_LATEST_INCUBATION_STATUS_BY_USER, [userId])
  return row?.status ?? null
}

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
