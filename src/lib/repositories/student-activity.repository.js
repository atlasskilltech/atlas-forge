import 'server-only'

import { query, queryOne } from '@/lib/db'
import * as sql from '@/lib/queries/student-activity'
import { bool, iso, num } from '@/lib/utils/rows'

/**
 * Read side of the Student Activity API. Every function is a parameterised
 * SELECT that maps rows to domain objects; nothing here writes. Kept separate
 * from the registrations repository so this feature touches no existing path.
 */

const toRegistration = (row) => ({
  id: num(row.id),
  reference: row.reference,
  studentApplicationId: row.student_application_id,
  roleCategory: row.role_category,
  status: row.status,
  rejectionReason: row.rejection_reason ?? null,
  createdAt: iso(row.created_at),
  reviewedAt: iso(row.reviewed_at),
  approvedUserId: num(row.approved_user_id),
})

const toAccount = (row) => ({
  id: num(row.id),
  appId: row.app_id,
  name: row.full_name,
  status: row.status,
  createdAt: iso(row.created_at),
  lastActiveAt: iso(row.last_active_at),
  isDeleted: Boolean(row.deleted_at),
})

const toRole = (row) => ({
  roleId: num(row.role_id),
  slug: row.slug,
  name: row.name,
  isPrimary: bool(row.is_primary),
  grantedAt: iso(row.granted_at),
  revokedAt: iso(row.revoked_at),
})

const toIncubation = (row) => ({
  id: num(row.id),
  ideaName: row.idea_name,
  status: row.status,
  completionPct: num(row.completion_pct),
  submittedAt: iso(row.submitted_at),
  reviewedAt: iso(row.reviewed_at),
  createdAt: iso(row.created_at),
})

const toOwnedStartup = (row) => ({
  id: num(row.id),
  name: row.name,
  status: row.status,
  relationship: 'owner',
  roleTitle: null,
  createdAt: iso(row.created_at),
})

const toMemberStartup = (row) => ({
  id: num(row.startup_id),
  name: row.name,
  status: row.status,
  relationship: 'member',
  roleTitle: row.role_title ?? null,
  joinedAt: iso(row.joined_at),
  createdAt: iso(row.created_at),
})

const toGrant = (row) => ({
  id: num(row.id),
  startupId: num(row.startup_id),
  incubationApplicationId: num(row.incubation_application_id),
  reason: row.reason ?? null,
  grantedAt: iso(row.granted_at),
  revokedAt: iso(row.revoked_at),
})

const toAuditEntry = (row) => ({
  id: num(row.id),
  action: row.action,
  module: row.module,
  entityType: row.entity_type,
  entityId: num(row.entity_id),
  status: row.status,
  createdAt: iso(row.created_at),
})

/** Atlas Student registrations with this exact University Application ID. */
export async function findRegistrationsByApplicationId(applicationId) {
  const rows = await query(sql.SELECT_REGISTRATIONS_BY_APPLICATION_ID, [applicationId])
  return rows.map(toRegistration)
}

/** The account bundle for a user id, or an empty bundle when there is no account. */
export async function findAccountBundle(userId) {
  if (!userId) {
    return { account: null, roles: [], incubation: [], startups: [], grants: [] }
  }

  const [accountRow, roleRows, incubationRows, ownedRows, memberRows, grantRows] =
    await Promise.all([
      queryOne(sql.SELECT_ACCOUNT_BY_ID, [userId]),
      query(sql.SELECT_ROLES_BY_USER, [userId]),
      query(sql.SELECT_INCUBATION_BY_USER, [userId]),
      query(sql.SELECT_STARTUPS_OWNED_BY_USER, [userId]),
      query(sql.SELECT_STARTUP_MEMBERSHIPS_BY_USER, [userId]),
      query(sql.SELECT_FOUNDER_GRANTS_BY_USER, [userId]),
    ])

  return {
    account: accountRow ? toAccount(accountRow) : null,
    roles: roleRows.map(toRole),
    incubation: incubationRows.map(toIncubation),
    startups: [...ownedRows.map(toOwnedStartup), ...memberRows.map(toMemberStartup)],
    grants: grantRows.map(toGrant),
  }
}

/**
 * Audit-log entries about this student. `registrationId` is always available;
 * `userId` may be null (no account), in which case the actor/user clauses match
 * nothing — which is correct.
 */
export async function findAuditForStudent({ registrationId, userId = null }) {
  const rows = await query(sql.SELECT_ACTIVITY_LOGS_FOR_STUDENT, [registrationId, userId, userId])
  return rows.map(toAuditEntry)
}
