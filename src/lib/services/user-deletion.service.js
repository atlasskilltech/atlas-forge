import 'server-only'

import { execute, queryOne, queryValue, transaction } from '@/lib/db'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { ROLES } from '@/config/roles'
import { normalizeEmail } from '@/lib/auth/role-policy'
import * as platform from '@/lib/repositories/platform.repository'
import { T } from '@/lib/queries/tables.mjs'
import { countActiveBackendManagers } from './roles.service'

/**
 * PERMANENT hard delete of one user (Backend Manager only).
 *
 * There is no soft delete and no backup: the user row and everything listed in
 * DELETE_STEPS are removed in ONE transaction (all or nothing). The plan, per
 * foreign key to forge_users, was agreed before this was built:
 *
 *   Deleted by the database (ON DELETE CASCADE): role rows, sessions,
 *     notifications, founder access grants, student profile + skills,
 *     startup team membership.
 *   Deleted here, in this order (the database would otherwise refuse):
 *     DELETE_STEPS below — including the applications OTHER people made to
 *     this user's listings, and both sides of messages / contracts / contact
 *     logs (agreed: deleted for both people).
 *   Set to NULL by the database (row kept): audit "who did it" columns,
 *     mentors.user_id, and startups.owner_user_id — a founder's startup is
 *     KEPT with no owner (agreed).
 *   Also deleted: the registration / outsider-incubation forms that were
 *     approved INTO this account (they hold the person's name, email, phone),
 *     and login-attempt rows for their App ID or email.
 *
 * The preview and the delete read the same step list, so the numbers the
 * manager confirms are exactly what is removed.
 */

/** Ordered: rows that block a later delete are removed first. */
const DELETE_STEPS = [
  {
    key: 'listingApplications',
    label: "Other people's applications to this user's listings",
    count: `SELECT COUNT(*) FROM ${T.applications} a JOIN ${T.listings} l ON l.id = a.listing_id WHERE l.created_by = ?`,
    remove: `DELETE a FROM ${T.applications} a JOIN ${T.listings} l ON l.id = a.listing_id WHERE l.created_by = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'applications',
    label: 'Job applications made by this user',
    count: `SELECT COUNT(*) FROM ${T.applications} WHERE applicant_user_id = ?`,
    remove: `DELETE FROM ${T.applications} WHERE applicant_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'contracts',
    label: 'Contracts (both sides)',
    count: `SELECT COUNT(*) FROM ${T.contracts} WHERE founder_user_id = ? OR student_user_id = ?`,
    remove: `DELETE FROM ${T.contracts} WHERE founder_user_id = ? OR student_user_id = ?`,
    params: (u) => [u.id, u.id],
  },
  {
    key: 'listings',
    label: 'Listings this user created',
    count: `SELECT COUNT(*) FROM ${T.listings} WHERE created_by = ?`,
    remove: `DELETE FROM ${T.listings} WHERE created_by = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'mentorshipSessions',
    label: 'Mentorship sessions (as mentee)',
    count: `SELECT COUNT(*) FROM ${T.mentorship_sessions} WHERE mentee_user_id = ?`,
    remove: `DELETE FROM ${T.mentorship_sessions} WHERE mentee_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'mentorshipRequests',
    label: 'Mentorship requests',
    count: `SELECT COUNT(*) FROM ${T.mentorship_requests} WHERE requester_user_id = ?`,
    remove: `DELETE FROM ${T.mentorship_requests} WHERE requester_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'messages',
    label: 'Messages (sent and received)',
    count: `SELECT COUNT(*) FROM ${T.messages} WHERE sender_user_id = ? OR recipient_user_id = ?`,
    remove: `DELETE FROM ${T.messages} WHERE sender_user_id = ? OR recipient_user_id = ?`,
    params: (u) => [u.id, u.id],
  },
  {
    key: 'contacts',
    label: 'Contact logs (both sides)',
    count: `SELECT COUNT(*) FROM ${T.concierge_contacts} WHERE founder_user_id = ? OR student_user_id = ?`,
    remove: `DELETE FROM ${T.concierge_contacts} WHERE founder_user_id = ? OR student_user_id = ?`,
    params: (u) => [u.id, u.id],
  },
  {
    key: 'postedNeeds',
    label: 'Posted needs',
    count: `SELECT COUNT(*) FROM ${T.posted_needs} WHERE founder_user_id = ?`,
    remove: `DELETE FROM ${T.posted_needs} WHERE founder_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'registrations',
    label: 'Registration forms approved into this account',
    count: `SELECT COUNT(*) FROM ${T.registration_requests} WHERE approved_user_id = ?`,
    remove: `DELETE FROM ${T.registration_requests} WHERE approved_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'outsiderApplications',
    label: 'Public incubation forms approved into this account',
    count: `SELECT COUNT(*) FROM ${T.outsider_incubation_applications} WHERE approved_user_id = ?`,
    remove: `DELETE FROM ${T.outsider_incubation_applications} WHERE approved_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'incubationApplications',
    label: 'Incubation applications',
    count: `SELECT COUNT(*) FROM ${T.incubation_applications} WHERE applicant_user_id = ?`,
    remove: `DELETE FROM ${T.incubation_applications} WHERE applicant_user_id = ?`,
    params: (u) => [u.id],
  },
  {
    key: 'loginAttempts',
    label: 'Login attempt records',
    count: `SELECT COUNT(*) FROM ${T.login_attempts} WHERE identifier IN (?, ?)`,
    remove: `DELETE FROM ${T.login_attempts} WHERE identifier IN (?, ?)`,
    params: (u) => [u.appId, u.email],
  },
]

/** Removed by the database itself when the user row goes (shown in the preview). */
const CASCADE_COUNTS = [
  { key: 'roles', label: 'Role rows (current and past)', sql: `SELECT COUNT(*) FROM ${T.user_roles} WHERE user_id = ?` },
  { key: 'sessions', label: 'Sign-in sessions', sql: `SELECT COUNT(*) FROM ${T.sessions} WHERE user_id = ?` },
  { key: 'notifications', label: 'Notifications', sql: `SELECT COUNT(*) FROM ${T.notifications} WHERE user_id = ?` },
  { key: 'grants', label: 'Founder access grants', sql: `SELECT COUNT(*) FROM ${T.founder_access_grants} WHERE user_id = ?` },
  { key: 'studentProfile', label: 'Job Seeker profile', sql: `SELECT COUNT(*) FROM ${T.student_profiles} WHERE user_id = ?` },
  { key: 'studentSkills', label: 'Skills', sql: `SELECT COUNT(*) FROM ${T.student_skills} WHERE user_id = ?` },
  { key: 'startupMembership', label: 'Startup team memberships', sql: `SELECT COUNT(*) FROM ${T.startup_members} WHERE user_id = ?` },
]

/** Any row in forge_users, including a soft-deleted one. */
async function loadTarget(userId, conn) {
  const row = await queryOne(
    `SELECT u.id, u.app_id, u.full_name, u.email,
            (SELECT r.slug FROM ${T.user_roles} ur JOIN ${T.roles} r ON r.id = ur.role_id
              WHERE ur.user_id = u.id AND ur.revoked_at IS NULL LIMIT 1) AS role_slug
       FROM ${T.users} u WHERE u.id = ?${conn ? ' FOR UPDATE' : ''}`,
    [userId],
    conn
  )
  if (!row) return null
  return { id: Number(row.id), appId: row.app_id, name: row.full_name, email: row.email, roleSlug: row.role_slug }
}

function assertUserId(userId) {
  const id = Number(userId)
  if (!Number.isInteger(id) || id < 1) throw new ValidationError('Choose an account to delete.')
  return id
}

/** What a delete would remove — shown in the confirmation step. Read-only. */
export async function previewDelete({ userId, actorId }) {
  const id = assertUserId(userId)
  const user = await loadTarget(id)
  if (!user) throw new NotFoundError('User')

  const removed = []
  for (const step of DELETE_STEPS) {
    removed.push({ key: step.key, label: step.label, count: Number(await queryValue(step.count, step.params(user))) })
  }
  for (const item of CASCADE_COUNTS) {
    removed.push({ key: item.key, label: item.label, count: Number(await queryValue(item.sql, [user.id])) })
  }
  const startupsKept = Number(
    await queryValue(`SELECT COUNT(*) FROM ${T.startups} WHERE owner_user_id = ?`, [user.id])
  )

  return {
    user: { id: user.id, appId: user.appId, name: user.name, email: user.email, roleSlug: user.roleSlug },
    removed: removed.filter((item) => item.count > 0),
    // Kept, with the owner cleared (agreed: keep the startup with no owner).
    startupsKeptWithoutOwner: startupsKept,
    blocked: id === actorId ? 'You cannot delete your own account.' : null,
  }
}

/**
 * Permanently delete a user. `confirmEmail` must equal the user's email
 * (any letter case) — the "type the email" confirmation step.
 */
export async function hardDeleteUser({ userId, actorId, confirmEmail }) {
  const id = assertUserId(userId)
  if (id === actorId) throw new ForbiddenError('You cannot delete your own account.')

  const before = await loadTarget(id)
  if (!before) throw new NotFoundError('User')
  if (!confirmEmail || normalizeEmail(confirmEmail) !== normalizeEmail(before.email)) {
    throw new ValidationError('Type the user’s email address exactly to confirm.', {
      fields: { confirmEmail: 'This does not match the user’s email address.' },
    })
  }

  const outcome = await transaction(async (tx) => {
    // Lock the row, and re-read inside the transaction so the checks below see
    // the same data the deletes act on.
    const user = await loadTarget(id, tx)
    if (!user) return { error: 'gone' }

    if (user.roleSlug === ROLES.BACKEND_MANAGER) {
      const others = await countActiveBackendManagers({ excludingUserId: user.id }, tx)
      if (others < 1) return { error: 'last-backend-manager' }
    }

    const removed = {}
    for (const step of DELETE_STEPS) {
      const { affectedRows } = await execute(step.remove, step.params(user), tx)
      removed[step.key] = affectedRows
    }
    const { affectedRows } = await execute(`DELETE FROM ${T.users} WHERE id = ?`, [user.id], tx)
    if (affectedRows !== 1) throw new Error('User row was not deleted.')

    // Audit: who, when (created_at) and the deleted id / App ID only — no
    // password, name, email or other personal data.
    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Permanently deleted user #${user.id} (${user.appId})`,
        module: 'Admin',
        entityType: 'user',
        entityId: user.id,
        status: 'action',
      },
      tx
    )
    return { error: null, user, removed }
  })

  if (outcome.error === 'gone') throw new NotFoundError('User')
  if (outcome.error === 'last-backend-manager') {
    throw new ConflictError('This is the last Backend Manager and cannot be deleted. Make someone else a Backend Manager first.')
  }
  return { deleted: true, userId: outcome.user.id, appId: outcome.user.appId, removed: outcome.removed }
}
