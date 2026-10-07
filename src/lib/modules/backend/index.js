import 'server-only'

import { requireRoleOrRedirect } from '@/lib/auth/guard'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import { validator } from '@/lib/validate'
import {
  accountsService,
  incubationService,
  listingsService,
  lookupsService,
  platformService,
  startupsService,
  studentsService,
} from '@/lib/services'
import * as forge from '@/lib/modules/forge'
import { getSharedProfile } from '@/lib/modules/shared'
import * as present from './presenter'

/**
 * Screen assembly for the Backend Manager module.
 *
 * This is the override role. Its two distinctive powers — deciding a listing
 * *as* the Backend Manager over an existing Forge Manager verdict, and
 * granting or revoking Founder access directly — are the reason the approvals
 * table is keyed by role rather than by listing alone.
 *
 * Screens shared with the Forge Manager (Contact Log, Contract Log, All
 * Listings, Platform Logs) reuse that module's assembly rather than a second
 * copy, so the same row can never render differently for the two roles.
 */

const QUICK_ACCESS_CONTROLS = [
  { label: 'Grant Founder Access', href: '/backend/grant-access', variant: 'primary' },
  { label: 'Revoke Access', href: '/backend/revoke-access', variant: 'danger' },
  { label: 'Review Job Queue', href: '/backend/job-queue', variant: 'secondary' },
  { label: 'Platform Settings', href: '/backend/settings', variant: 'secondary' },
]

const MOBILE_QUICK_ACTIONS = [
  { label: 'All Users', href: '/backend/users', primary: true },
  { label: 'Job Queue', href: '/backend/job-queue' },
  { label: 'Settings', href: '/backend/settings' },
]

const USER_FILTERS = ['All', 'Students', 'Founders', 'Managers', 'Inactive']
const QUEUE_TABS = ['All Pending', 'Job Listings', 'Collab Posts', 'Approved', 'Rejected']

/**
 * The roles a staff account may be created with. Deliberately the three
 * administrative roles only — a Backend Manager provisions colleagues, not
 * students or founders, which have their own self-service onboarding.
 */
const STAFF_ROLE_SLUGS = ['forge-manager', 'backend-manager', 'super-admin']

// A pragmatic email shape check. The authoritative check is a real delivery;
// this only rejects input that could not be an address.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function requireBackendPage(returnTo) {
  const identity = await requireRoleOrRedirect('backend-manager', returnTo)
  return {
    identity,
    user: identity.user,
    chromeUser: { name: identity.user.name, initials: identity.user.initials },
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getDashboard() {
  const [stats, activity] = await Promise.all([
    platformService.stats(),
    platformService.listActivity({ limit: 4 }),
  ])

  return {
    stats: present.toDashboardStats(stats),
    mobileStats: present.toMobileDashboardStats(stats),
    activity: activity.map(present.toActivityRow),
    quickAccessControls: QUICK_ACCESS_CONTROLS,
    quickActions: MOBILE_QUICK_ACTIONS,
  }
}

export async function getUsers() {
  const users = await studentsService.listAll()
  const now = new Date()
  const rows = users.map((user) => present.toUserRow(user, { now }))
  return { users: rows, filters: USER_FILTERS, counts: present.toUserCounts(rows) }
}

/**
 * Options for the Create Staff User form.
 *
 * Role labels come from the roles lookup rather than being hard-coded, so the
 * dropdown stays in step with any rename an administrator makes in reference
 * data — the same reason the account classifier matches on slugs, not names.
 */
export async function getCreateStaffForm() {
  const roles = await lookupsService.getRoles()
  return {
    roles: roles
      .filter((role) => STAFF_ROLE_SLUGS.includes(role.slug))
      .map((role) => ({ value: role.slug, label: role.name })),
  }
}

/**
 * The override queue.
 *
 * Every listing is shown, not only the undecided ones — the Backend Manager's
 * job here is to be able to revisit a decision the Forge Manager has already
 * made, which is impossible if decided listings are hidden.
 */
export async function getJobQueue() {
  const listings = await listingsService.getApprovalQueue({})
  const rows = listings.map(present.toQueueRow)
  return { rows, tabs: QUEUE_TABS, pending: present.toQueueCount(rows) }
}

/**
 * Role Management.
 *
 * `query` is the App ID or name typed into the search box. The match is made
 * on the server so the client never receives the full directory just to filter
 * it — an administrator searching for one account should not be handed
 * everyone else's.
 */
export async function getRoleManagement(query = null) {
  const [users, grants] = await Promise.all([
    studentsService.listAll(),
    incubationService.listGrants({}),
  ])

  const term = String(query ?? '').trim().toLowerCase()
  const match = term
    ? users.find(
        (user) =>
          user.appId.toLowerCase() === term ||
          user.appId.toLowerCase().includes(term) ||
          user.name.toLowerCase().includes(term)
      )
    : null

  const profile = match ? await studentsService.getProfile(match.id).catch(() => null) : null

  return {
    query: query ?? '',
    searched: Boolean(term),
    matched: match ? present.toMatchedUser(match, profile) : null,
    grants: grants.map(present.toGrantRow),
    assignments: users
      .filter((user) => (user.roleSlugs ?? []).includes('student'))
      .map(present.toRoleAssignment),
  }
}

export async function getSettings() {
  const settings = await lookupsService.getSettings()
  return {
    groups: present.toSettingsGroups(settings),
    mobile: present.toMobileSettings(settings),
  }
}

export async function getLogs() {
  return forge.getPlatformLogs().then(({ logs }) => ({ logs }))
}

/**
 * The Platform Logs audit table, in its own row shape.
 *
 * `page` is optional. Without it the screen gets the newest 100 entries, as it
 * always has; with it the caller can reach further back. `total` is returned
 * alongside so the route can report how much there is — the table itself has
 * no pagination controls in the reference set and ignores the extra key.
 */
export async function getAuditTable(page = null) {
  const [activity, total] = await Promise.all([
    platformService.listActivity({ limit: page?.limit ?? 100, offset: page?.offset ?? null }),
    platformService.countActivity({}),
  ])
  return { rows: activity.map(present.toLogRow), total }
}

/**
 * Error Logs.
 *
 * Reads `error_logs`, not activity filtered by module. The mock stood in for
 * this table because it did not exist yet; the dashboard's "Platform Errors"
 * counter has always read the real one.
 */
export async function getErrorLogs(page = null) {
  const [errors, total] = await Promise.all([
    platformService.listErrors({ limit: page?.limit ?? null, offset: page?.offset ?? null }),
    platformService.countErrors(),
  ])
  return { rows: errors.map(present.toErrorRow), total }
}

// The manager roles share one profile screen — see `@/lib/modules/shared`.
export const getProfile = (user) => getSharedProfile(user)

// Shared with the Forge Manager — same rows, same mapping.
export const getContacts = () => forge.getContacts()
export const getContracts = () => forge.getContracts()
export const getListings = () => forge.getListings()

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Approve or reject a listing as the Backend Manager.
 *
 * `roleSlug` is fixed to `backend-manager`, so the decision is recorded
 * alongside the Forge Manager's rather than replacing it, and the service
 * flags it as an override when a Forge Manager verdict already exists.
 */
export async function decideListing(user, input) {
  const listingId = Number(input.listingId)
  if (!Number.isInteger(listingId) || listingId < 1) {
    throw new ValidationError('Choose a listing to decide on.')
  }

  await listingsService.decide({
    listingId,
    decision: input.decision,
    roleSlug: 'backend-manager',
    actorId: user.id,
    reason: input.reason?.trim() || null,
  })
  return { listingId, decision: input.decision }
}

/**
 * Create a staff account.
 *
 * Every submitted field is checked here, at the module boundary, before the
 * service is asked to write anything — the form gets back one `ValidationError`
 * listing every bad field at once rather than one round trip per mistake.
 *
 * `password` is optional: left blank, the service generates a strong temporary
 * one and returns it once for the Backend Manager to hand over.
 */
export async function createStaffUser(user, input) {
  const check = validator()
  const name = check.text('name', input.name, { required: true, max: 160, label: 'Full name' })
  const email = check.text('email', input.email, { required: true, max: 255, label: 'Email' })
  const roleSlug = check.oneOf('role', input.role, STAFF_ROLE_SLUGS, {
    required: true,
    label: 'Role',
  })

  let password
  if (input.password !== undefined && input.password !== null && input.password !== '') {
    password = check.text('password', input.password, { min: 10, max: 128, label: 'Password' })
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    check.reject('email', 'Enter a valid email address.')
  }

  check.throwIfInvalid()

  return accountsService.createStaffUser({
    name,
    email,
    roleSlug,
    password: password ?? null,
    actorId: user.id,
  })
}

export async function grantAccess(user, input) {
  const userId = Number(input.userId)
  if (!Number.isInteger(userId) || userId < 1) {
    throw new ValidationError('Choose an account to grant access to.')
  }

  await incubationService.grantAccessToUser({
    userId,
    actorId: user.id,
    reason: input.reason?.trim() || null,
  })
  return { userId, granted: true }
}

/**
 * Revoke Founder access.
 *
 * Accepts either the grant or the account — the desktop table revokes a
 * specific grant, the search result revokes whoever was found — and resolves
 * both to the same active grant before removing the role.
 */
export async function revokeAccess(user, input) {
  const grants = await incubationService.listGrants({})
  const grantId = input.grantId ? Number(input.grantId) : null
  const userId = input.userId ? Number(input.userId) : null

  const grant = grantId
    ? grants.find((row) => row.id === grantId)
    : grants.find((row) => row.user.id === userId && row.isActive)

  if (!grant) throw new NotFoundError('Founder access grant')
  if (!grant.isActive) throw new ConflictError('That access has already been revoked.')

  await incubationService.revokeFounderAccess({
    grantId: grant.id,
    userId: grant.user.id,
    actorId: user.id,
    reason: input.reason?.trim() || null,
  })
  return { grantId: grant.id, userId: grant.user.id, revoked: true }
}

/**
 * Change a platform setting.
 *
 * The value is coerced to the type the setting declares, so a checkbox cannot
 * store the string "false" into a boolean and have every feature check read it
 * as true.
 */
export async function updateSetting(user, input) {
  if (!input?.key) throw new ValidationError('Choose a setting to change.')

  const setting = await lookupsService.getSetting(input.key)
  if (!setting) throw new NotFoundError('Setting')

  let value = input.value
  if (setting.valueType === 'boolean') value = Boolean(value) ? 'true' : 'false'
  else if (setting.valueType === 'number') {
    const parsed = Number(value)
    if (!Number.isFinite(parsed)) throw new ValidationError(`${setting.label} must be a number.`)
    value = String(parsed)
  } else {
    value = String(value ?? '').trim()
    if (!value) throw new ValidationError(`${setting.label} cannot be empty.`)
  }

  await platformService.updateSetting({ key: input.key, value, actorId: user.id })
  return { key: input.key, value }
}

/**
 * The Danger Zone reset.
 *
 * Requires the caller to repeat the confirmation phrase the dialog shows, so a
 * mis-routed request or a stray click in a client that skipped the dialog
 * cannot clear the platform on its own.
 */
export async function resetPlatform(user, input) {
  if (input?.confirm !== 'RESET') {
    throw new ValidationError('Confirm the reset before it can run.')
  }
  return platformService.resetPlatformData({ actorId: user.id })
}
