import { ROLE_HOME } from '@/config/navigation'
import { ROLE_PRIORITY } from '@/lib/auth/role-policy'

/**
 * Where a signed-in user goes, decided from the role they hold.
 *
 * This is the ONE place that turns a role into a landing page. Password login,
 * Google Sign-In, `/select-role` and `/member/home` all route through it, so
 * the two sign-in paths can never drift apart.
 *
 * One user = one role, so there is never a role picker: the user goes straight
 * to their role's dashboard. If the database still returns more than one
 * active role (only possible before migration 015 runs), the highest by
 * `ROLE_PRIORITY` is used — the same rule the migration applies. Retired roles
 * such as `network-member` have no dashboard and are ignored.
 *
 * Kept free of `server-only` and database access: it is pure, takes the role
 * list `buildIdentity` already loaded, and can be unit-tested directly.
 */

/** The single role the user acts as, or `null` when they hold no usable role. */
export function effectiveRole(roles = []) {
  for (const slug of ROLE_PRIORITY) {
    const match = roles.find((role) => role?.slug === slug)
    if (match && ROLE_HOME[slug]) return match
  }
  return null
}

/** The role slug a fresh session should act as, or `null`. */
export function sessionRoleFor(roles = []) {
  return effectiveRole(roles)?.slug ?? null
}

/** The dashboard to land on, or `null` (the caller decides; today: /login). */
export function landingPathFor(roles = []) {
  const role = effectiveRole(roles)
  return role ? ROLE_HOME[role.slug] : null
}
