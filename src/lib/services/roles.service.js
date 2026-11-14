import 'server-only'

import { queryValue, transaction } from '@/lib/db'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/errors'
import { ROLES } from '@/config/roles'
import { isAssignableRole, isStaffRole, staffEmailError } from '@/lib/auth/role-policy'
import { effectiveRole } from '@/lib/auth/role-routing'
import * as incubation from '@/lib/repositories/incubation.repository'
import * as platform from '@/lib/repositories/platform.repository'
import * as users from '@/lib/repositories/users.repository'
import { T } from '@/lib/queries/tables.mjs'
import { getRoleBySlug } from './lookups.service'

/**
 * One user = one role: reading and changing a user's single role.
 *
 * Every path that gives someone a role (registration approval, incubation
 * approval, staff creation, the Backend Manager's role change) ends in
 * `users.setSingleRole`, which replaces the old role rather than adding one.
 */

/** The user's single current role (`{ id, slug, name }`) or `null`. */
export async function currentRole(userId) {
  return effectiveRole(await users.findRoles(userId))
}

/**
 * Throws when this account must not be turned into a Founder by an incubation
 * approval: staff accounts keep their staff role (a Backend Manager can still
 * change it deliberately with `changeRole`).
 */
export async function assertCanBecomeFounder(userId) {
  const role = await currentRole(userId)
  if (role && isStaffRole(role.slug)) {
    throw new ConflictError(
      `This account is a ${role.name}. Staff accounts cannot become Founders through incubation. A Backend Manager can change the role directly if that is really intended.`
    )
  }
  return role
}

/** Active Backend Managers, optionally ignoring one user. */
export async function countActiveBackendManagers({ excludingUserId = null } = {}, conn) {
  return Number(
    await queryValue(
      `SELECT COUNT(DISTINCT u.id)
         FROM ${T.users} u
         JOIN ${T.user_roles} ur ON ur.user_id = u.id AND ur.revoked_at IS NULL
         JOIN ${T.roles} r ON r.id = ur.role_id AND r.slug = ?
        WHERE u.deleted_at IS NULL AND u.status = 'active' AND (? IS NULL OR u.id <> ?)`,
      [ROLES.BACKEND_MANAGER, excludingUserId, excludingUserId],
      conn
    )
  )
}

/**
 * Backend Manager: change ANY user's role to ANY of the five roles.
 *
 * Rules:
 *   - exactly one role afterwards (the old one is replaced);
 *   - a staff role needs an @atlasuniversity.edu.in email;
 *   - you cannot change your own role (so you cannot lock yourself out);
 *   - the last active Backend Manager cannot be moved to another role;
 *   - moving someone AWAY from Founder closes their open Founder access grant,
 *     moving someone TO Founder records a grant (like incubation approval).
 */
export async function changeRole({ userId, roleSlug, actorId, reason = null }) {
  if (!isAssignableRole(roleSlug)) throw new ValidationError('Choose one of the five roles.')
  if (userId === actorId) throw new ForbiddenError('You cannot change your own role.')

  const user = await users.findById(userId)
  if (!user) throw new NotFoundError('User')

  const emailError = staffEmailError(roleSlug, user.email)
  if (emailError) throw new ValidationError(emailError, { fields: { role: emailError } })

  const [target, before] = await Promise.all([getRoleBySlug(roleSlug), currentRole(userId)])
  if (!target) throw new ValidationError(`The ${roleSlug} role is missing from reference data.`)
  if (before?.slug === roleSlug) {
    return { userId, role: { slug: target.slug, name: target.name }, changed: false }
  }

  const result = await transaction(async (tx) => {
    if (before?.slug === ROLES.BACKEND_MANAGER) {
      const others = await countActiveBackendManagers({ excludingUserId: userId }, tx)
      if (others < 1) return { blocked: 'last-backend-manager' }
    }

    await users.setSingleRole(userId, target.id, { grantedBy: actorId }, tx)

    if (before?.slug === ROLES.FOUNDER) {
      const grants = await incubation.findGrants({ userId })
      for (const grant of grants.filter((row) => row.isActive)) {
        await incubation.revokeGrant(grant.id, actorId, reason ?? 'Role changed by Backend Manager', tx)
      }
    }
    if (roleSlug === ROLES.FOUNDER) {
      const grants = await incubation.findGrants({ userId })
      if (!grants.some((row) => row.isActive)) {
        await incubation.createGrant(
          { userId, startupId: null, applicationId: null, grantedBy: actorId, reason: reason ?? 'Role changed by Backend Manager' },
          tx
        )
      }
    }

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Changed role of ${user.appId}: ${before?.name ?? 'none'} → ${target.name}`,
        module: 'Access',
        entityType: 'user',
        entityId: userId,
        status: 'action',
      },
      tx
    )
    return { blocked: null }
  })

  if (result.blocked === 'last-backend-manager') {
    throw new ConflictError('This is the last Backend Manager. Make someone else a Backend Manager first.')
  }

  return { userId, role: { slug: target.slug, name: target.name }, previous: before?.slug ?? null, changed: true }
}
