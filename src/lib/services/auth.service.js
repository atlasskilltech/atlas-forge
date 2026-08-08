import 'server-only'

import { execute, transaction } from '@/lib/db'
import { ForbiddenError, UnauthorizedError, ValidationError } from '@/lib/errors'
import { hashPassword, needsRehash, verifyPassword } from '@/lib/auth/password'
import * as users from '@/lib/repositories/users.repository'

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
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [upgraded, record.id])
  }

  await users.touchLastActive(record.id)
  return buildIdentity(record.id)
}

/** The signed-in user plus everything authorisation needs. */
export async function buildIdentity(userId) {
  const [user, roles, permissions] = await Promise.all([
    users.findById(userId),
    users.findRoles(userId),
    users.findPermissions(userId),
  ])
  if (!user) throw new UnauthorizedError('Account no longer exists.')

  return {
    user,
    roles,
    permissions,
    defaultRole: roles.find((role) => role.isPrimary) ?? roles[0] ?? null,
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

/** True when the chosen role is one the user actually holds. */
export function holdsRole(identity, roleSlug) {
  return Boolean(identity?.roles?.some((role) => role.slug === roleSlug))
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
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId], tx)
    return true
  })
}
