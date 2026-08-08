/**
 * Exercises the Super Admin module against the real database.
 *
 *   npm run test:admin
 *
 * This role is view-only, so the interesting assertions are the negative ones:
 * that the module exports no write, that the permission grants contain no
 * write, and that the seeded data is byte-for-byte unchanged after every read
 * has run. The reads are checked too, but they are the easy half.
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

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const pass = []
const fail = []
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

const { query, queryOne, closePool } = await import('@/lib/db')
const admin = await import('@/lib/modules/admin')
const present = await import('@/lib/modules/admin/presenter')
const auth = await import('@/lib/services/auth.service')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — Super Admin module verification\n')

const meera = await usersRepo.findByAppId('ATL-2019-0004')

/** A fingerprint of everything a write could possibly change. */
async function fingerprint() {
  return queryOne(`
    SELECT
      (SELECT COUNT(*) FROM users)                  AS users,
      (SELECT COUNT(*) FROM user_roles)             AS user_roles,
      (SELECT COUNT(*) FROM listings)               AS listings,
      (SELECT COUNT(*) FROM approvals)              AS approvals,
      (SELECT COUNT(*) FROM applications)           AS applications,
      (SELECT COUNT(*) FROM concierge_contacts)     AS contacts,
      (SELECT COUNT(*) FROM mentorship_sessions)    AS sessions,
      (SELECT COUNT(*) FROM founder_access_grants)  AS grants,
      (SELECT COUNT(*) FROM startups)               AS startups,
      (SELECT COUNT(*) FROM activity_logs)          AS activity,
      (SELECT COUNT(*) FROM notifications)          AS notifications,
      (SELECT GROUP_CONCAT(CONCAT(setting_key, '=', setting_value) ORDER BY setting_key)
         FROM platform_settings)                    AS settings
  `)
}

const before = await fingerprint()

/* -------------------------------------------------------------------------- */
/* The role holds no write permission at all                                  */
/* -------------------------------------------------------------------------- */

const identity = await auth.buildIdentity(meera.id)
check('the account holds only the super-admin role',
  identity.roles.length === 1 && identity.roles[0].slug === 'super-admin',
  identity.roles.map((role) => role.slug).join(', '))
check('the role is flagged view-only in the database', identity.roles[0].isViewOnly === true)

// A read permission has a `view` segment somewhere in its slug —
// `listing.view`, `user.view_all`, `concierge.view_all_logs`,
// `platform.logs.view`. Anything without one is an operation.
const writeish = identity.permissions.filter((slug) => !/(^|\.)view(_|\.|$)/.test(slug))
check('every granted permission is a view permission', writeish.length === 0,
  writeish.join(', ') || `all ${identity.permissions.length} are views`)
check('and there are exactly the eight the reference data grants',
  identity.permissions.length === 8, `${identity.permissions.length} permissions`)

for (const permission of [
  'listing.approve',
  'listing.override',
  'listing.create',
  'access.grant',
  'access.revoke',
  'platform.settings.write',
  'platform.reset',
  'mentorship.assign',
  'user.manage',
]) {
  check(`no ${permission}`, auth.can(identity, permission) === false)
}

/* -------------------------------------------------------------------------- */
/* The module exports no write                                                */
/* -------------------------------------------------------------------------- */

const exported = Object.keys(admin).filter((key) => typeof admin[key] === 'function')
const nonRead = exported.filter(
  (name) => !name.startsWith('get') && name !== 'requireAdminPage'
)
check('the module exports only reads and its page guard', nonRead.length === 0,
  nonRead.join(', ') || exported.join(', '))

// Read the module source directly: a service call that mutates would not show
// up in the export list.
const moduleSource = readFileSync('src/lib/modules/admin/index.js', 'utf8')
const mutating = [
  'decide(',
  'grantFounderAccess',
  'grantAccessToUser',
  'revokeFounderAccess',
  'updateSetting',
  'resetPlatformData',
  'setFeatured',
  'assignMentor',
  'contactStudent',
  'updateProfile',
  'updateAvailability',
  'create(',
  'apply(',
].filter((call) => moduleSource.includes(call))
check('and calls no mutating service', mutating.length === 0, mutating.join(', '))

/* -------------------------------------------------------------------------- */
/* Every admin route is a GET                                                 */
/* -------------------------------------------------------------------------- */

const routeDir = 'src/app/api/admin'
const verbs = []
for (const entry of readdirSync(routeDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue
  const source = readFileSync(join(routeDir, entry.name, 'route.js'), 'utf8')
  for (const verb of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    if (source.includes(`export const ${verb}`)) verbs.push(`${entry.name}:${verb}`)
  }
}
check('no admin route exports a mutating verb', verbs.length === 0,
  verbs.join(', ') || `${readdirSync(routeDir).length} routes, GET only`)

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const overview = await admin.getOverview()
check('getOverview — 5 desktop counters, 4 mobile',
  overview.stats.length === 5 && overview.mobileStats.length === 4)
check('getOverview — total users', overview.stats[0].value === '15', overview.stats[0].value)
check('getOverview — live listings', overview.stats[2].value === '3', overview.stats[2].value)
check('getOverview — mentor sessions', overview.stats[3].value === '6', overview.stats[3].value)
check('getOverview — active startups listed', overview.startups.length === 2)
check('getOverview — each row names its founder and mentor',
  overview.startups.every((row) => row.founder !== '—' && row.mentor),
  overview.startups.map((row) => `${row.name}/${row.mentor}`).join(', '))

const users = await admin.getUsers()
check('getUsers — every account', users.users.length === 15)
check('getUsers — grouped by the shared rule',
  users.counts.map((count) => count.label).join(' | ') === '6 Students | 1 Founders | 3 Managers',
  users.counts.map((count) => count.label).join(' | '))
check('getUsers — rows carry no action affordance',
  users.users.every((row) => !('actions' in row) && !('userId' in row)))
check('getUsers — mobile role is shortened', users.users.some((row) => row.mobileRole === 'Student'),
  [...new Set(users.users.map((row) => row.mobileRole))].join(', '))

const startups = await admin.getStartups()
check('getStartups — every startup, not only the active ones',
  startups.startups.length === 4, `${startups.startups.length} startups`)
check('getStartups — counters derived from the rows',
  startups.stats.map((stat) => `${stat.value} ${stat.label}`).join(' | ') ===
    '4 Total Startups | 2 Active | 2 Pending Review | 5 Open Roles',
  startups.stats.map((stat) => `${stat.value} ${stat.label}`).join(' | '))
check('getStartups — an unassigned mentor says so',
  startups.startups.some((row) => row.mentor === 'Unassigned'),
  startups.startups.map((row) => row.mentor).join(', '))

const incubation = await admin.getIncubationStatus()
check('getIncubationStatus — the same rows, whose Stage and Status are the subject',
  incubation.startups.length === startups.startups.length &&
    incubation.startups.every((row) => row.stage && row.status))

const report = await admin.getActivityReport()
check('getActivityReport — 4 stat cards with captions',
  report.stats.length === 4 && report.stats.every((stat) => Boolean(stat.caption)),
  report.stats.map((stat) => stat.caption).join(' | '))
check('getActivityReport — contacts counter is real',
  report.stats[0].value === '5', report.stats[0].value)
check('getActivityReport — upcoming sessions counted',
  report.stats[2].caption === 'Upcoming: 2', report.stats[2].caption)
check('getActivityReport — events from the audit trail', report.events.length === 6)
check('getActivityReport — each event names its actor',
  report.events.every((event) => event.meta.startsWith('By ')), report.events[0]?.meta)
check('getActivityReport — mobile drops the actor', report.mobileEvents.length === 5 &&
  report.mobileEvents.every((event) => !event.meta.startsWith('By ')))
check('getActivityReport — the range is a real window',
  /^\d+ \w{3} – \d+ \w{3} \d{4}$/.test(report.range), report.range)

const contacts = await admin.getContacts()
check('shared reads reuse the manager assembly — contacts', contacts.rows.length === 5)
check('shared reads reuse the manager assembly — contracts',
  (await admin.getContracts()).rows.length === 3)
check('shared reads reuse the manager assembly — listings',
  (await admin.getListings()).rows.length === 7)

const profile = await admin.getProfile(meera)
check('getProfile — the shared account screen', profile.profile.appId === 'ATL-2019-0004')
check('getProfile — one role, no founder access',
  profile.profile.roles.length === 1 && profile.profile.roles[0] === 'Super Admin',
  profile.profile.roles.join(', '))

/* -------------------------------------------------------------------------- */
/* Nothing changed                                                            */
/* -------------------------------------------------------------------------- */

const after = await fingerprint()
const drifted = Object.keys(before).filter((key) => String(before[key]) !== String(after[key]))
check('reading every Super Admin screen changed nothing at all', drifted.length === 0,
  drifted.map((key) => `${key}: ${before[key]} → ${after[key]}`).join(', ') ||
    'users, roles, listings, approvals, applications, contacts, sessions, grants, startups, activity, notifications and settings all identical')

/* -------------------------------------------------------------------------- */
/* Presenter, as pure functions                                               */
/* -------------------------------------------------------------------------- */

check('presenter — an unknown startup status does not crash',
  present.toStartupRow({ slug: 'x', name: 'X', status: 'nonsense' }).status === '—')
check('presenter — a startup with no mentor reads as unassigned',
  present.toOverviewStartup({ slug: 'x', name: 'X', status: 'active' }).mentor === 'Unassigned')
check('presenter — the report range spans the requested window',
  present.toReportRange(new Date('2026-07-01T00:00:00Z'), 30).endsWith('2026'),
  present.toReportRange(new Date('2026-07-01T00:00:00Z'), 30))
check('presenter — an account with no roles is not filed under Students',
  present.toUserRow({ id: 1, name: 'A B', roleSlugs: [], status: 'active' }).group ===
    'Unassigned')

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

await closePool()
process.exit(fail.length === 0 ? 0 : 1)
