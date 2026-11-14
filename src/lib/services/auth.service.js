import 'server-only'

import { execute, transaction } from '@/lib/db'
import { ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/errors'
import { hashPassword, needsRehash, verifyPassword } from '@/lib/auth/password'
import * as users from '@/lib/repositories/users.repository'
import { canOpenArea } from '@/lib/auth/role-policy'
import { effectiveRole } from '@/lib/auth/role-routing'

import { T } from '@/lib/queries/tables.mjs'

/**
 * Authentication and the identity attached to a request.
 *
 * Services never touch cookies or headers — the route handler or Server Action
 * owns that. This keeps the same functions usable from a script or a test.
 */

/**
 * Verify credentials and return the user with their roles and permissions.
 *
 * A missing account and a wrong password produce the *same* error, so the
 * response cannot be used to enumerate valid App IDs.
 */
export async function authenticate(identifier, password) {
  if (!identifier?.trim() || !password) {
    throw new ValidationError('Enter your App ID and password.')
  }

  const record = await users.findCredentials(identifier.trim())
  const ok = record ? await verifyPassword(password, record.password_hash) : false
  if (!record || !ok) {
    throw new UnauthorizedError('That App ID or password is incorrect.')
  }
  if (record.status !== 'active') {
    throw new UnauthorizedError('This account is not active. Contact the Forge Manager.')
  }

  // Transparently upgrade hashes stored with weaker parameters.
  if (needsRehash(record.password_hash)) {
    const upgraded = await hashPassword(password)
    await execute(`UPDATE ${T.users} SET password_hash = ? WHERE id = ?`, [upgraded, record.id])
  }

  await users.touchLastActive(record.id)
  return buildIdentity(record.id)
}

/**
 * The signed-in user plus everything authorisation needs.
 *
 * One user = one role. `roles` is always a list of at most ONE role (kept as a
 * list so existing callers keep working), and `permissions` are that role's
 * only. If the database still holds several active roles for this user (only
 * possible before migration 015), the highest by priority is used and the
 * others grant nothing.
 */
export async function buildIdentity(userId) {
  const [user, heldRoles] = await Promise.all([users.findById(userId), users.findRoles(userId)])
  if (!user) throw new UnauthorizedError('Account no longer exists.')

  const role = effectiveRole(heldRoles)
  const permissions = role ? await users.findRolePermissions(role.id) : []

  return {
    user,
    roles: role ? [{ ...role, isPrimary: true }] : [],
    permissions,
    defaultRole: role ? { ...role, isPrimary: true } : null,
  }
}

/** True when the identity holds `permission` through any of its roles. */
export function can(identity, permission) {
  return Boolean(identity?.permissions?.includes(permission))
}

/** Throws unless the identity holds the permission. */
export function assertCan(identity, permission) {
  if (!can(identity, permission)) throw new ForbiddenError()
}

/**
 * True when the identity may open the area that belongs to `roleSlug`: its own
 * role's area, plus — for a Backend Manager only — the Forge Manager and Super
 * Admin areas (see `canOpenArea` in `@/lib/auth/role-policy`).
 */
export function holdsRole(identity, roleSlug) {
  return canOpenArea((identity?.roles ?? []).map((role) => role.slug), roleSlug)
}

export async function changePassword(userId, currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    throw new ValidationError('New password must be at least 8 characters.')
  }
  const user = await users.findById(userId)
  if (!user) throw new UnauthorizedError()

  const record = await users.findCredentials(user.appId)
  if (!record || !(await verifyPassword(currentPassword, record.password_hash))) {
    throw new UnauthorizedError('Your current password is incorrect.')
  }

  const hash = await hashPassword(newPassword)
  return transaction(async (tx) => {
    // Any successful password change also clears a pending forced-change flag:
    // the temporary password has now been rotated. A no-op for the users whose
    // flag is already 0.
    await execute(
      `UPDATE ${T.users} SET password_hash = ?, must_change_password = 0 WHERE id = ?`,
      [hash, userId],
      tx
    )
    return true
  })
}
