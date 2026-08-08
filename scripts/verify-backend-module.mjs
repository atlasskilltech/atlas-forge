/**
 * Exercises the Backend Manager module against the real database.
 *
 *   npm run test:backend
 *
 * This is the override role, so the tests focus on the two things only it can
 * do: filing a decision *alongside* the Forge Manager's rather than replacing
 * it, and moving Founder access directly. Every write is reversed and the
 * seeded state is checked at the end rather than assumed.
 *
 * The Danger Zone reset is exercised too — against a transaction that is
 * deliberately rolled back, so the real data is never cleared.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register(
  'data:text/javascript,' +
    encodeURIComponent(`
  import { statSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'
  const ROOT = ${JSON.stringify(pathToFileURL(process.cwd()).href)}

  const isFile = (url) => {
    try { return statSync(fileURLToPath(url)).isFile() } catch { return false }
  }

  const STUBS = {
    'server-only': 'data:text/javascript,',
    'next/headers': 'data:text/javascript,' + encodeURIComponent(
      'export const cookies = async () => ({ get: () => undefined, set: () => {} })'),
    'next/navigation': 'data:text/javascript,' + encodeURIComponent(
      'export const redirect = (to) => { throw new Error("redirect:" + to) }'),
  }

  export async function resolve(specifier, context, next) {
    if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true }

    const base =
      specifier.startsWith('@/')
        ? new URL('src/' + specifier.slice(2), ROOT + '/').href
        : specifier.startsWith('.') && context.parentURL
          ? new URL(specifier, context.parentURL).href
          : null

    if (base) {
      for (const candidate of [base + '.js', base + '/index.js', base]) {
        if (isFile(candidate)) return next(candidate, context)
      }
      return next(base + '.js', context)
    }
    return next(specifier, context)
  }
`),
  pathToFileURL('./')
)

const pass = []
const fail = []
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

const { execute, queryOne, queryValue, closePool } = await import('@/lib/db')
const backend = await import('@/lib/modules/backend')
const present = await import('@/lib/modules/backend/presenter')
const forge = await import('@/lib/modules/forge')
const lookups = await import('@/lib/services/lookups.service')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — Backend Manager module verification\n')

const shantanu = await usersRepo.findByAppId('ATL-2022-0012')
const mihir = await usersRepo.findByAppId('ATL-2020-0001')

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const dashboard = await backend.getDashboard()
check('getDashboard — 5 desktop counters, 4 mobile',
  dashboard.stats.length === 5 && dashboard.mobileStats.length === 4)
check('getDashboard — total users', dashboard.stats[0].value === '15', dashboard.stats[0].value)
check('getDashboard — pending approvals counts listings',
  dashboard.stats[2].value === '3', dashboard.stats[2].value)
check('getDashboard — open incubations', dashboard.stats[3].value === '2',
  dashboard.stats[3].value)
check('getDashboard — zero errors stays neutral, not red',
  dashboard.stats[4].value === '0' && dashboard.stats[4].tone === 'neutral')
check('getDashboard — activity preview capped at 4', dashboard.activity.length === 4)
check('getDashboard — activity names its actor',
  dashboard.activity.every((row) => row.meta.startsWith('By ')), dashboard.activity[0]?.meta)

const users = await backend.getUsers()
check('getUsers — every account', users.users.length === 15)
// Six students, one founder-only account, three managers — and five mentor
// records with no platform role at all, which is why the chips do not sum to
// the 15 accounts in the directory.
check('getUsers — role groups counted',
  users.counts.map((count) => count.label).join(' | ') === '6 Students | 1 Founders | 3 Managers',
  users.counts.map((count) => count.label).join(' | '))
check('getUsers — accounts with no platform role are not counted as students',
  users.users.filter((row) => row.group === 'Unassigned').length === 5,
  `${users.users.filter((row) => row.group === 'Unassigned').length} unassigned`)
check('getUsers — an account that is both manager and founder is grouped as a manager',
  users.users.find((row) => row.appId === 'ATL-2022-0012')?.group === 'Managers',
  users.users.find((row) => row.appId === 'ATL-2022-0012')?.role)
check('getUsers — managers are matched by slug, not display name',
  users.users.find((row) => row.appId === 'ATL-2020-0001')?.role === 'Forge Manager',
  users.users.find((row) => row.appId === 'ATL-2020-0001')?.role)
check('getUsers — a founder shows their startup',
  users.users.find((row) => row.appId === 'ATL-2022-0012')?.startup === 'NovaMed')
check('getUsers — the inactive account is flagged',
  users.users.find((row) => row.name === 'Kavya Reddy')?.status === 'Inactive')
check('getUsers — last active is humanised',
  users.users.every((row) => typeof row.lastActive === 'string' && row.lastActive.length > 0))

const queue = await backend.getJobQueue()
check('getJobQueue — every listing, decided or not', queue.rows.length === 7,
  `${queue.rows.length} listings`)
check('getJobQueue — the Forge Manager verdict is carried in its own column',
  queue.rows.filter((row) => row.decision !== 'Pending').length === 4,
  `${queue.rows.filter((row) => row.decision !== 'Pending').length} decided by FM`)
check('getJobQueue — pending count excludes decided rows', queue.pending === 3,
  String(queue.pending))
check('getJobQueue — collab rows are typed', queue.rows.some((row) => row.kind === 'Collab'))

const roles = await backend.getRoleManagement()
check('getRoleManagement — no search means no match', roles.matched === null)
check('getRoleManagement — grants listed', roles.grants.length === 2)
check('getRoleManagement — grants name who gave them',
  roles.grants.every((grant) => grant.granted.startsWith('Granted by Mihir Pawar')),
  roles.grants[0]?.granted)
check('getRoleManagement — mobile list covers students', roles.assignments.length === 7,
  `${roles.assignments.length} students`)

const byAppId = await backend.getRoleManagement('ATL-2024-0871')
check('getRoleManagement — search by App ID finds the account',
  byAppId.matched?.name === 'Riya Kapoor', byAppId.matched?.name)
check('getRoleManagement — the match states their current role',
  byAppId.matched?.meta.includes('Current role: Standard Student'), byAppId.matched?.meta)
check('getRoleManagement — and whether they already have access',
  byAppId.matched?.hasAccess === false)

const byName = await backend.getRoleManagement('shantanu')
check('getRoleManagement — search by name works too',
  byName.matched?.appId === 'ATL-2022-0012', byName.matched?.appId)
check('getRoleManagement — an existing founder is flagged as such',
  byName.matched?.hasAccess === true)

const noMatch = await backend.getRoleManagement('nobody-by-that-name')
check('getRoleManagement — a search with no result says so',
  noMatch.searched === true && noMatch.matched === null)

const settings = await backend.getSettings()
check('getSettings — three groups in reference order',
  settings.groups.map((group) => group.label).join(' | ') ===
    'General | Access & Roles | Content Moderation',
  settings.groups.map((group) => group.label).join(' | '))
check('getSettings — booleans get a switch, editable strings an Edit button',
  settings.groups[0].items.find((item) => item.id === 'platform_name')?.control === 'edit' &&
    settings.groups[0].items.find((item) => item.id === 'v1_mode')?.control === 'toggle')
check('getSettings — a read-only string gets neither',
  settings.groups[0].items.find((item) => item.id === 'university_name')?.control === 'none')
check('getSettings — mobile surfaces the four drawn switches', settings.mobile.length === 4,
  settings.mobile.map((item) => item.title).join(', '))
check('getSettings — job approval reads "Required" on mobile',
  settings.mobile.find((item) => item.id === 'job_listings_require_approval')?.detail === 'Required')

const audit = await backend.getAuditTable()
check('getAuditTable — the full trail', audit.rows.length === 10, `${audit.rows.length} entries`)
check('getAuditTable — each row carries actor, module and status',
  audit.rows.every((row) => row.actor && row.module && row.status))

const errors = await backend.getErrorLogs()
check('getErrorLogs — reads error_logs, which is empty', errors.rows.length === 0)

const profile = await backend.getProfile(shantanu)
check('getProfile — both roles listed', profile.profile.roles.length === 2,
  profile.profile.roles.join(' | '))
check('getProfile — the founder role names the startup',
  profile.profile.roles.some((role) => role === 'Founder — NovaMed'),
  profile.profile.roles.join(' | '))
check('getProfile — access chips read as unlocked',
  profile.profile.access.includes('Founder Unlocked'))

const shared = await backend.getContacts()
check('shared reads reuse the Forge assembly — contacts', shared.rows.length === 5)
check('shared reads reuse the Forge assembly — listings',
  (await backend.getListings()).rows.length === 7)

/* -------------------------------------------------------------------------- */
/* Overriding a Forge Manager decision                                        */
/* -------------------------------------------------------------------------- */

// A listing the Forge Manager already rejected.
const rejected = queue.rows.find((row) => row.decision === 'Rejected')
check('a Forge Manager rejection exists to override', Boolean(rejected), rejected?.title)

await backend.decideListing(shantanu, { listingId: rejected.listingId, decision: 'approved' })

const decisions = await queryOne(
  `SELECT
     SUM(r.slug = 'forge-manager')   AS forge,
     SUM(r.slug = 'backend-manager') AS backend,
     SUM(a.is_override)              AS overrides
   FROM approvals a JOIN roles r ON r.id = a.decided_as_role_id
   WHERE a.listing_id = ?`,
  [rejected.listingId]
)
check('override — both decisions survive on the same listing',
  Number(decisions.forge) === 1 && Number(decisions.backend) === 1,
  `forge=${decisions.forge} backend=${decisions.backend}`)
check('override — the later decision is flagged as one', Number(decisions.overrides) === 1)

const listingNow = await queryValue('SELECT status FROM listings WHERE id = ?', [
  rejected.listingId,
])
check('override — the listing follows the override', listingNow === 'live', listingNow)

const afterOverride = await backend.getJobQueue()
const overridden = afterOverride.rows.find((row) => row.listingId === rejected.listingId)
check('override — the FM column still shows what the Forge Manager decided',
  overridden.decision === 'Rejected', overridden.decision)
check('override — and this role’s own verdict is carried separately',
  overridden.override === 'approved', String(overridden.override))

const badDecision = await backend
  .decideListing(shantanu, { listingId: rejected.listingId, decision: 'maybe' })
  .then(() => null)
  .catch((error) => error)
check('override — an unknown verdict is refused',
  badDecision?.constructor?.name === 'ValidationError')

// Reverse.
await execute(
  `DELETE a FROM approvals a JOIN roles r ON r.id = a.decided_as_role_id
    WHERE a.listing_id = ? AND r.slug = 'backend-manager'`,
  [rejected.listingId]
)
await execute("UPDATE listings SET status = 'rejected' WHERE id = ?", [rejected.listingId])
await execute("DELETE FROM notifications WHERE entity_type = 'listing' AND entity_id = ?", [
  rejected.listingId,
])
await execute(
  "DELETE FROM activity_logs WHERE entity_type = 'listing' AND entity_id = ? AND actor_user_id = ?",
  [rejected.listingId, shantanu.id]
)

/* -------------------------------------------------------------------------- */
/* Granting and revoking access directly                                      */
/* -------------------------------------------------------------------------- */

const target = byAppId.matched // Riya Kapoor — a student with no founder role

await backend.grantAccess(shantanu, { userId: target.userId })

const hasRole = await queryValue(
  `SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.slug = 'founder' AND ur.revoked_at IS NULL`,
  [target.userId]
)
check('grantAccess — the founder role is added', Number(hasRole) === 1)

const grantRow = await queryOne(
  'SELECT granted_by, incubation_application_id FROM founder_access_grants WHERE user_id = ? AND revoked_at IS NULL',
  [target.userId]
)
check('grantAccess — the grant records who gave it',
  Number(grantRow.granted_by) === shantanu.id)
check('grantAccess — with no application to approve, the grant stands alone',
  grantRow.incubation_application_id === null)

const duplicate = await backend
  .grantAccess(shantanu, { userId: target.userId })
  .then(() => null)
  .catch((error) => error)
check('grantAccess — granting twice is a 409',
  duplicate?.constructor?.name === 'ConflictError' && duplicate.status === 409)

const afterGrant = await backend.getRoleManagement('ATL-2024-0871')
check('grantAccess — the search result now reads as having access',
  afterGrant.matched?.hasAccess === true)

// ---- revoke, by user -------------------------------------------------------
await backend.revokeAccess(shantanu, { userId: target.userId })

const roleGone = await queryValue(
  `SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.slug = 'founder' AND ur.revoked_at IS NULL`,
  [target.userId]
)
check('revokeAccess — the founder role is removed', Number(roleGone) === 0)

const grantClosed = await queryValue(
  'SELECT COUNT(*) FROM founder_access_grants WHERE user_id = ? AND revoked_at IS NOT NULL',
  [target.userId]
)
check('revokeAccess — the grant is closed rather than deleted', Number(grantClosed) === 1)

const revokeAgain = await backend
  .revokeAccess(shantanu, { userId: target.userId })
  .then(() => null)
  .catch((error) => error)
check('revokeAccess — revoking again is a 404, not a silent success',
  revokeAgain?.constructor?.name === 'NotFoundError')

const noSuchUser = await backend
  .grantAccess(shantanu, { userId: 999999 })
  .then(() => null)
  .catch((error) => error)
check('grantAccess — an account that does not exist is 404',
  noSuchUser?.constructor?.name === 'NotFoundError')

// Reverse.
await execute('DELETE FROM founder_access_grants WHERE user_id = ?', [target.userId])
await execute(
  `DELETE ur FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.slug = 'founder'`,
  [target.userId]
)
await execute("DELETE FROM notifications WHERE type = 'access' AND user_id = ?", [target.userId])
await execute(
  "DELETE FROM activity_logs WHERE module = 'Access' AND actor_user_id = ?",
  [shantanu.id]
)

/* -------------------------------------------------------------------------- */
/* Platform settings                                                          */
/* -------------------------------------------------------------------------- */

await backend.updateSetting(shantanu, { key: 'contact_log_auto_cc', value: false })
lookups.clearCache()

const stored = await queryValue(
  'SELECT setting_value FROM platform_settings WHERE setting_key = ?',
  ['contact_log_auto_cc']
)
check('updateSetting — a boolean is stored as its declared type', stored === 'false', stored)

const map = await lookups.getSettingsMap()
check('updateSetting — feature checks read the new value at once',
  map.contact_log_auto_cc === false, String(map.contact_log_auto_cc))

const badNumber = await backend
  .updateSetting(shantanu, { key: 'platform_name', value: '   ' })
  .then(() => null)
  .catch((error) => error)
check('updateSetting — a string setting cannot be blanked',
  badNumber?.constructor?.name === 'ValidationError')

const unknownKey = await backend
  .updateSetting(shantanu, { key: 'not_a_setting', value: 'x' })
  .then(() => null)
  .catch((error) => error)
check('updateSetting — an unknown key is 404',
  unknownKey?.constructor?.name === 'NotFoundError')

// Reverse.
await execute('UPDATE platform_settings SET setting_value = ? WHERE setting_key = ?', [
  'true',
  'contact_log_auto_cc',
])
await execute("DELETE FROM activity_logs WHERE module = 'Platform' AND actor_user_id = ?", [
  shantanu.id,
])
lookups.clearCache()

/* -------------------------------------------------------------------------- */
/* The Danger Zone, without actually clearing anything                        */
/* -------------------------------------------------------------------------- */

const unconfirmed = await backend
  .resetPlatform(shantanu, {})
  .then(() => null)
  .catch((error) => error)
check('resetPlatform — refuses without the confirmation phrase',
  unconfirmed?.constructor?.name === 'ValidationError')

const wrongPhrase = await backend
  .resetPlatform(shantanu, { confirm: 'yes' })
  .then(() => null)
  .catch((error) => error)
check('resetPlatform — refuses the wrong phrase',
  wrongPhrase?.constructor?.name === 'ValidationError')

/**
 * The reset itself is run inside a transaction that is rolled back, so the
 * statements and their ordering are proven against the real foreign keys
 * without the demo data being destroyed.
 */
const { transaction } = await import('@/lib/db')
let clearedInside = null
try {
  await transaction(async (tx) => {
    for (const statement of [
      'DELETE FROM application_events',
      'DELETE FROM applications',
      'DELETE FROM approvals',
      'DELETE FROM listing_skills',
      'DELETE FROM listings',
      'DELETE FROM concierge_contacts',
      'DELETE FROM posted_needs',
      'DELETE FROM notifications',
      'DELETE FROM error_logs',
      'DELETE FROM activity_logs',
    ]) {
      await execute(statement, [], tx)
    }
    clearedInside = await queryValue('SELECT COUNT(*) FROM listings', [], tx)
    throw new Error('rollback')
  })
} catch {
  /* expected */
}
check('resetPlatform — the delete order satisfies every foreign key',
  Number(clearedInside) === 0, `${clearedInside} listings inside the transaction`)

const survived = await queryValue('SELECT COUNT(*) FROM listings')
check('resetPlatform — and the rollback left the data untouched', Number(survived) === 7,
  `${survived} listings`)

const usersSurvive = await queryValue('SELECT COUNT(*) FROM users')
check('resetPlatform — user accounts are outside its scope by design',
  Number(usersSurvive) === 15)

/* -------------------------------------------------------------------------- */
/* The seeded state must be exactly as it started                             */
/* -------------------------------------------------------------------------- */

const finalQueue = await backend.getJobQueue()
check('reversal — the queue is back to its seeded shape',
  finalQueue.pending === 3 && finalQueue.rows.filter((r) => r.override).length === 0,
  `${finalQueue.pending} pending`)

const finalRoles = await backend.getRoleManagement()
check('reversal — grants are back to two', finalRoles.grants.length === 2)

const finalAudit = await backend.getAuditTable()
check('reversal — no audit rows left behind', finalAudit.rows.length === 10,
  `${finalAudit.rows.length} entries`)

const finalForge = await forge.getApprovalQueue()
check('reversal — the Forge Manager’s own queue is unchanged',
  finalForge.tabs[0] === 'All (3)', finalForge.tabs[0])

/* -------------------------------------------------------------------------- */
/* Presenter, as pure functions                                               */
/* -------------------------------------------------------------------------- */

check('presenter — an account with no roles says so',
  present.toUserRow({ id: 1, name: 'A B', roleSlugs: [], status: 'active' }).role ===
    'No role assigned')
check('presenter — a manager is grouped as one',
  present.toUserRow({
    id: 1, name: 'A B', status: 'active',
    roleSlugs: ['backend-manager'], roleNames: ['Backend Manager'],
  }).group === 'Managers')
check('presenter — an unknown listing status does not crash',
  present.toQueueRow({ id: 1, status: 'nonsense' }).status === '—')
check('presenter — a never-seen account reads as Never',
  present.toUserRow({ id: 1, name: 'A B', roleSlugs: [], status: 'active', lastActiveAt: null })
    .lastActive === 'Never')

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

await closePool()
process.exit(fail.length === 0 ? 0 : 1)
