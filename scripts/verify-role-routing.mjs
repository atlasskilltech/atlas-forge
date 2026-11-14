import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ROLE_HOME } from '@/config/navigation'
import { ROLES } from '@/config/roles'
import {
  hasPortalRole,
  landingPathFor,
  routableRoles,
  sessionRoleFor,
} from '@/lib/auth/role-routing'

/**
 * Post-login routing, shared by password login, Google Sign-In, /select-role
 * and /member/home.
 *
 *   npm run test:auth:routing      (no database or server needed)
 *
 * Each case is the role list `buildIdentity` returns for a user, so this is the
 * exact decision the Google callback → /select-role redirect makes.
 */

const role = (slug, isPrimary = false) => ({ slug, isPrimary })

test('a user with one portal role lands on that role dashboard (every role)', () => {
  for (const slug of [
    ROLES.STUDENT,
    ROLES.FOUNDER,
    ROLES.FORGE_MANAGER,
    ROLES.BACKEND_MANAGER,
    ROLES.SUPER_ADMIN,
  ]) {
    const roles = [role(slug, true)]
    assert.equal(landingPathFor(roles), ROLE_HOME[slug], slug)
    assert.equal(sessionRoleFor(roles), slug, slug)
  }
})

test('a portal user who ALSO holds network-member skips /member/home', () => {
  // Registration approval attaches network-member to an existing account as a
  // non-primary role — this is the "Google login lands on member home" case.
  const roles = [role(ROLES.FORGE_MANAGER, true), role(ROLES.NETWORK_MEMBER)]
  assert.equal(landingPathFor(roles), '/forge/dashboard')
  assert.equal(sessionRoleFor(roles), ROLES.FORGE_MANAGER)
  assert.equal(hasPortalRole(roles), true)
})

test('portal role wins even when network-member is the primary role', () => {
  const roles = [role(ROLES.STUDENT), role(ROLES.NETWORK_MEMBER, true)]
  assert.equal(landingPathFor(roles), '/student/home')
  assert.equal(sessionRoleFor(roles), ROLES.STUDENT)
})

test('several portal roles → role picker, member role not offered', () => {
  const roles = [
    role(ROLES.FORGE_MANAGER, true),
    role(ROLES.BACKEND_MANAGER),
    role(ROLES.NETWORK_MEMBER),
  ]
  assert.equal(landingPathFor(roles), '/select-role')
  assert.deepEqual(
    routableRoles(roles).map((r) => r.slug),
    [ROLES.FORGE_MANAGER, ROLES.BACKEND_MANAGER]
  )
  assert.equal(sessionRoleFor(roles), ROLES.FORGE_MANAGER)
})

test('a member-only user (brand-new Google registrant) keeps /member/home', () => {
  const roles = [role(ROLES.NETWORK_MEMBER, true)]
  assert.equal(landingPathFor(roles), '/member/home')
  assert.equal(sessionRoleFor(roles), ROLES.NETWORK_MEMBER)
  assert.equal(hasPortalRole(roles), false)
})

test('no roles → no landing (caller sends to /login)', () => {
  assert.equal(landingPathFor([]), null)
  assert.equal(sessionRoleFor([]), null)
  assert.equal(landingPathFor(undefined), null)
})

test('unknown role slugs are ignored', () => {
  assert.equal(landingPathFor([role('mentor', true)]), null)
  assert.equal(landingPathFor([role('mentor', true), role(ROLES.FOUNDER)]), '/founder/home')
})
