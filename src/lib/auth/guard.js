import 'server-only'

import { cache } from 'react'
import { redirect } from 'next/navigation'
import { ForbiddenError, UnauthorizedError } from '@/lib/errors'
import * as auth from '@/lib/services/auth.service'
import { readSession } from './session'

/**
 * Turns the session cookie into a real identity.
 *
 * Route Handlers use the `require*` functions and let the error mapper turn a
 * failure into 401/403. Pages use the `*OrRedirect` variants, because a page
 * should send an anonymous visitor to the login screen rather than render an
 * error.
 *
 * `cache()` memoises for the lifetime of a single request, so a page that
 * renders several server components resolves the identity once instead of
 * re-querying users, roles and permissions for each one.
 */

export const getIdentity = cache(async () => {
  const session = await readSession()
  if (!session) return null

  try {
    const identity = await auth.buildIdentity(session.userId)
    // The cookie names a role, but the roles the user *holds* come from the
    // database on every request — so a revoked role stops working immediately
    // instead of lasting until the cookie expires.
    const activeRole =
      identity.roles.find((role) => role.slug === session.role) ?? identity.defaultRole
    return { ...identity, activeRole, session }
  } catch {
    // Account deleted or deactivated since the cookie was issued.
    return null
  }
})

export async function requireIdentity() {
  const identity = await getIdentity()
  if (!identity) throw new UnauthorizedError('Sign in to continue.')
  return identity
}

/** Require an authenticated user who holds `roleSlug`. */
export async function requireRole(roleSlug) {
  const identity = await requireIdentity()
  if (!auth.holdsRole(identity, roleSlug)) {
    throw new ForbiddenError('Your account does not have access to this area.')
  }
  return identity
}

/** Require a specific permission, e.g. `applications.create`. */
export async function requirePermission(permission) {
  const identity = await requireIdentity()
  auth.assertCan(identity, permission)
  return identity
}

/* -------------------------------------------------------------------------- */
/* Page variants — redirect instead of throwing                               */
/* -------------------------------------------------------------------------- */

export async function requireIdentityOrRedirect(returnTo) {
  const identity = await getIdentity()
  if (!identity) redirect(loginUrl(returnTo))
  return identity
}

export async function requireRoleOrRedirect(roleSlug, returnTo) {
  const identity = await requireIdentityOrRedirect(returnTo)
  if (!auth.holdsRole(identity, roleSlug)) redirect('/select-role')
  return identity
}

function loginUrl(returnTo) {
  return returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : '/login'
}
