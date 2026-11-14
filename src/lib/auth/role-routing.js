import { ROLE_HOME } from '@/config/navigation'
import { ROLES } from '@/config/roles'

/**
 * Where a signed-in user goes, decided from the roles they actually hold.
 *
 * This is the ONE place that turns roles into a landing page. Password login,
 * Google Sign-In, `/select-role` and `/member/home` all route through it, so
 * the two sign-in paths can never drift apart.
 *
 * `network-member` is the fallback role an approved public registration
 * receives. It carries no permissions and only reaches the placeholder
 * `/member/home`. When a user ALSO holds a real portal role (student, founder,
 * forge-manager, backend-manager, super-admin) that portal role wins: they go
 * to its dashboard, and the member role is not offered in the role picker. A
 * user whose only role is `network-member` still lands on `/member/home`.
 *
 * Kept free of `server-only` and database access: it is pure, takes the role
 * list `buildIdentity` already loaded, and can be unit-tested directly.
 */

const SELECT_ROLE_PATH = '/select-role'

/** True for a role that has a dashboard and is not the member fallback. */
const isPortalRole = (role) => role?.slug !== ROLES.NETWORK_MEMBER && Boolean(ROLE_HOME[role?.slug])

/** True when the user holds at least one real portal role. */
export function hasPortalRole(roles = []) {
  return roles.some(isPortalRole)
}

/**
 * The roles a user can be routed to: their portal roles when they have any,
 * otherwise whatever routable roles remain (in practice: just `network-member`).
 * Order is preserved (the query sorts by `sort_order`).
 */
export function routableRoles(roles = []) {
  const portal = roles.filter(isPortalRole)
  if (portal.length > 0) return portal
  return roles.filter((role) => Boolean(ROLE_HOME[role?.slug]))
}

/**
 * The role a fresh session should act as: the primary role when it is
 * routable, else the first routable role, else `null`.
 */
export function sessionRoleFor(roles = []) {
  const candidates = routableRoles(roles)
  return (candidates.find((role) => role.isPrimary) ?? candidates[0])?.slug ?? null
}

/**
 * The page a signed-in user should land on:
 *   • exactly one routable role → that role's dashboard;
 *   • several routable roles   → the role picker;
 *   • none                     → `null` (the caller decides; today: /login).
 */
export function landingPathFor(roles = []) {
  const candidates = routableRoles(roles)
  if (candidates.length === 0) return null
  if (candidates.length === 1) return ROLE_HOME[candidates[0].slug]
  return SELECT_ROLE_PATH
}
