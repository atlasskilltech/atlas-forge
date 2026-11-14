import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ROLE_HOME } from '@/config/navigation'
import { ROLES } from '@/config/roles'
import { effectiveRole, landingPathFor, sessionRoleFor } from '@/lib/auth/role-routing'

/**
 * Post-login routing, shared by password login, Google Sign-In, /select-role
 * and /member/home. One user = one role, so there is never a role picker.
 *
 *   npm run test:auth:routing      (no database or server needed)
 *
 * Each case is the role list `buildIdentity` returns for a user, so this is the
 * exact decision the Google callback → /select-role redirect makes.
 */

const role = (slug, isPrimary = false) => ({ slug, isPrimary })

test('each of the five roles lands on its own dashboard', () => {
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

test('the Job Seeker role (slug student) lands on /student/home', () => {
  assert.equal(landingPathFor([role(ROLES.STUDENT, true)]), '/student/home')
})

test('never a role picker: old multi-role data resolves to ONE role by priority', () => {
  // Same priority migration 015 uses: Super Admin > Backend > Forge > Founder > Job Seeker.
  assert.equal(sessionRoleFor([role(ROLES.STUDENT, true), role(ROLES.FOUNDER)]), ROLES.FOUNDER)
  assert.equal(sessionRoleFor([role(ROLES.FOUNDER, true), role(ROLES.BACKEND_MANAGER)]), ROLES.BACKEND_MANAGER)
  assert.equal(
    sessionRoleFor([role(ROLES.FORGE_MANAGER), role(ROLES.BACKEND_MANAGER), role(ROLES.SUPER_ADMIN)]),
    ROLES.SUPER_ADMIN
  )
  assert.notEqual(landingPathFor([role(ROLES.FORGE_MANAGER), role(ROLES.BACKEND_MANAGER)]), '/select-role')
})

test('the retired network-member role has no dashboard and is ignored', () => {
  assert.equal(landingPathFor([role('network-member', true)]), null)
  assert.equal(landingPathFor([role('network-member', true), role(ROLES.STUDENT)]), '/student/home')
  assert.equal(ROLE_HOME['network-member'], undefined)
})

test('no roles → no landing (caller sends to /login)', () => {
  assert.equal(landingPathFor([]), null)
  assert.equal(sessionRoleFor([]), null)
  assert.equal(landingPathFor(undefined), null)
  assert.equal(effectiveRole(undefined), null)
})

test('unknown role slugs are ignored', () => {
  assert.equal(landingPathFor([role('mentor', true)]), null)
  assert.equal(landingPathFor([role('mentor', true), role(ROLES.FOUNDER)]), '/founder/home')
})
