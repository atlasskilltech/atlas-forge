import assert from 'node:assert/strict'
import { test } from 'node:test'

import { ROLES } from '@/config/roles'
import {
  ASSIGNABLE_ROLES,
  canOpenArea,
  isAtlasEmail,
  pickSingleRole,
  registrationEmailError,
  staffEmailError,
  usesApplicationIdAsAppId,
} from '@/lib/auth/role-policy'

/**
 * The one-role rule and the staff-email rule, as pure functions.
 *
 *   npm run test:roles        (no database or server needed)
 *
 * The database half of the one-role rule (the unique index added by migration
 * 015) is checked by `npm run test:roles:db`.
 */

test('exactly five assignable roles, network-member is not one of them', () => {
  assert.deepEqual([...ASSIGNABLE_ROLES].sort(), [
    'backend-manager', 'forge-manager', 'founder', 'student', 'super-admin',
  ])
  assert.equal(ASSIGNABLE_ROLES.includes('network-member'), false)
  assert.equal(ROLES.NETWORK_MEMBER, undefined)
})

test('one role: collapsing several roles keeps exactly one, by priority', () => {
  assert.equal(pickSingleRole(['student', 'founder']), 'founder')
  assert.equal(pickSingleRole(['founder', 'backend-manager']), 'backend-manager')
  assert.equal(pickSingleRole(['forge-manager', 'backend-manager', 'super-admin']), 'super-admin')
  assert.equal(pickSingleRole(['forge-manager', 'founder', 'student']), 'forge-manager')
  assert.equal(pickSingleRole(['network-member']), 'student')
  assert.equal(pickSingleRole(['network-member', 'founder']), 'founder')
  assert.equal(pickSingleRole([]), 'student') // roleless (the seeded mentors) → Job Seeker
})

test('staff email rule: staff roles need @atlasuniversity.edu.in', () => {
  for (const slug of ['forge-manager', 'backend-manager', 'super-admin']) {
    assert.equal(staffEmailError(slug, 'a.b@atlasuniversity.edu.in'), null, slug)
    assert.equal(staffEmailError(slug, 'A.B@AtlasUniversity.EDU.IN '), null, `${slug} case/space`)
    assert.ok(staffEmailError(slug, 'a@gmail.com'), slug)
    assert.ok(staffEmailError(slug, 'a@mail.atlasuniversity.edu.in'), `${slug} subdomain`)
    assert.ok(staffEmailError(slug, 'a@atlasuniversity.edu.in.evil.com'), `${slug} lookalike`)
    assert.ok(staffEmailError(slug, ''), `${slug} empty`)
  }
  // Job Seekers and Founders may use any email.
  assert.equal(staffEmailError('student', 'a@gmail.com'), null)
  assert.equal(staffEmailError('founder', 'a@gmail.com'), null)
})

test('isAtlasEmail only accepts the exact domain', () => {
  assert.equal(isAtlasEmail('x@atlasuniversity.edu.in'), true)
  assert.equal(isAtlasEmail('@atlasuniversity.edu.in'), false)
  assert.equal(isAtlasEmail('x@alumni.atlasuniversity.edu.in'), false)
  assert.equal(isAtlasEmail(null), false)
})

test('registration: Atlas Student and Faculty need an Atlas email, others do not', () => {
  assert.ok(registrationEmailError('atlas_student', 'x@gmail.com'))
  assert.ok(registrationEmailError('atlas_faculty', 'x@gmail.com'))
  assert.equal(registrationEmailError('atlas_student', 'x@atlasuniversity.edu.in'), null)
  assert.equal(registrationEmailError('atlas_alumni', 'x@gmail.com'), null)
  assert.equal(registrationEmailError('others', 'x@gmail.com'), null)
  assert.equal(usesApplicationIdAsAppId('atlas_student'), true)
  assert.equal(usesApplicationIdAsAppId('atlas_faculty'), false)
})

test('Backend Manager may open Forge Manager and Super Admin areas; nobody else crosses over', () => {
  assert.equal(canOpenArea(['backend-manager'], 'forge-manager'), true)
  assert.equal(canOpenArea(['backend-manager'], 'super-admin'), true)
  assert.equal(canOpenArea(['backend-manager'], 'backend-manager'), true)
  assert.equal(canOpenArea(['backend-manager'], 'founder'), false)
  assert.equal(canOpenArea(['forge-manager'], 'backend-manager'), false)
  assert.equal(canOpenArea(['super-admin'], 'forge-manager'), false)
  assert.equal(canOpenArea(['student'], 'founder'), false)
  assert.equal(canOpenArea(['founder'], 'founder'), true)
})
