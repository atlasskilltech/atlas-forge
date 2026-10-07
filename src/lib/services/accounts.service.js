import 'server-only'

import { randomBytes } from 'node:crypto'
import { transaction } from '@/lib/db'
import { ConflictError, NotFoundError } from '@/lib/errors'
import { hashPassword } from '@/lib/auth/password'
import * as users from '@/lib/repositories/users.repository'
import * as lookups from '@/lib/repositories/lookups.repository'
import * as platform from '@/lib/repositories/platform.repository'

/**
 * Creating accounts the platform's managers provision directly, as opposed to
 * the self-service paths (student onboarding, the outsider incubation flow).
 *
 * Today that is one operation — a Backend Manager creating a staff account —
 * but it lives here, beside the identity repository it drives, rather than in a
 * module, so the transaction that must bind the user row, the role grant and
 * the audit entry together is defined in one place.
 */

/**
 * Create a staff account and grant it a single role, atomically.
 *
 * `password` is optional: when omitted a strong temporary one is generated and
 * returned exactly once, for the manager to hand over out of band. It is never
 * stored or logged in the clear — only its hash reaches the database.
 *
 * The role is granted as the account's primary role, since a freshly created
 * staff member holds nothing else, and `grantedBy` records which manager issued
 * it. The whole thing runs in a transaction: a failure after the user row is
 * written must not leave a roleless account behind.
 */
export async function createStaffUser({ name, email, roleSlug, password = null, actorId = null }) {
  const resolvedRole = await findRole(roleSlug)
  if (!resolvedRole) throw new NotFoundError('Role')

  const existing = await users.findByEmailAny(email)
  if (existing) {
    throw new ConflictError(
      existing.isDeleted
        ? `That email belonged to a removed account (${existing.appId}). Use a different address.`
        : `That email is already registered to ${existing.appId}.`
    )
  }

  const generatedPassword = password ? null : newTemporaryPassword()
  const passwordHash = await hashPassword(password ?? generatedPassword)

  const created = await transaction(async (tx) => {
    const appId = await users.nextAppId(new Date().getFullYear(), tx)
    const userId = await users.create(
      {
        appId,
        name,
        email,
        passwordHash,
        initials: initialsOf(name),
        avatarTone: 'primary',
        status: 'active',
      },
      tx
    )

    await users.grantRole(userId, resolvedRole.id, { isPrimary: true, grantedBy: actorId }, tx)

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Created staff account ${appId} (${resolvedRole.name})`,
        module: 'Admin',
        entityType: 'user',
        entityId: userId,
        status: 'success',
      },
      tx
    )

    return { id: userId, appId }
  })

  return {
    ...created,
    name,
    email,
    role: { slug: resolvedRole.slug, name: resolvedRole.name },
    // Present only when we generated it — shown to the manager once, never stored.
    temporaryPassword: generatedPassword,
  }
}

/** Resolve a role slug to its row via the lookup repository. */
async function findRole(slug) {
  if (!slug) return null
  const roles = await lookups.findLookup('roles')
  return roles.find((role) => role.slug === slug) ?? null
}

/**
 * 16 characters from a CSPRNG with a guaranteed upper, lower, digit and symbol,
 * so the temporary password satisfies any complexity rule by eye. Mirrors the
 * generator in the outsider incubation flow.
 */
function newTemporaryPassword() {
  const body = randomBytes(12).toString('base64url').replace(/[-_]/g, 'x')
  return `${body}Aa7!`
}

function initialsOf(name) {
  return (
    String(name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || null
  )
}
