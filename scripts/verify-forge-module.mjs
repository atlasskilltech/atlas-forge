/**
 * Exercises the Forge Manager module against the real database.
 *
 *   npm run test:forge
 *
 * Reads are asserted against the seeded data. Writes are the ones that matter
 * most in this module — a decision, an assignment, a grant — so each is made
 * and then reversed, and the script checks the seeded state is intact at the
 * end rather than trusting that it is.
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
const forge = await import('@/lib/modules/forge')
const present = await import('@/lib/modules/forge/presenter')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — Forge Manager module verification\n')

const mihir = await usersRepo.findByAppId('ATL-2020-0001')

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const dashboard = await forge.getDashboard()
check('getDashboard — 5 desktop counters, 4 mobile',
  dashboard.stats.length === 5 && dashboard.mobileStats.length === 4)
check('getDashboard — student count from student_profiles',
  dashboard.stats[0].value === '7', dashboard.stats[0].value)
check('getDashboard — jobs in queue counts pending listings',
  dashboard.stats[3].value === '3', dashboard.stats[3].value)
check('getDashboard — mentor requests counts open requests only',
  dashboard.stats[4].value === '2', dashboard.stats[4].value)
check('getDashboard — active startups', dashboard.stats[2].value === '2',
  dashboard.stats[2].value)

// The preview interleaves two different queues; both kinds must be reachable.
const kinds = new Set(dashboard.queue.map((row) => row.initial))
check('getDashboard — the queue previews both listings and mentor requests',
  kinds.has('J') && kinds.has('M'), [...kinds].join(', '))
check('getDashboard — the preview is capped at 4 rows', dashboard.queue.length === 4)
check('getDashboard — contact preview names both parties',
  dashboard.contacts[0]?.title.includes('→'), dashboard.contacts[0]?.title)
check('getDashboard — mobile pending shows waiting listings',
  dashboard.mobilePending.length === 2)

const queue = await forge.getApprovalQueue()
check('getApprovalQueue — every listing appears', queue.items.length === 7,
  `${queue.items.length} listings`)
check('getApprovalQueue — tab labels carry live counts',
  queue.tabs[0] === 'All (3)', queue.tabs.join(' | '))
check('getApprovalQueue — job and collab counts add up to the total',
  Number(queue.tabs[1].match(/\d+/)[0]) + Number(queue.tabs[2].match(/\d+/)[0]) ===
    Number(queue.tabs[0].match(/\d+/)[0]),
  `${queue.tabs[1]} + ${queue.tabs[2]} = ${queue.tabs[0]}`)
check('getApprovalQueue — decided listings carry their recorded verdict',
  queue.items.filter((item) => item.decision).length === 4,
  `${queue.items.filter((item) => item.decision).length} decided`)
check('getApprovalQueue — collabs get their own monogram',
  queue.items.some((item) => item.initial === 'C' && item.kind === 'collab'))

const pool = await forge.getStudentPool()
check('getStudentPool — excludes inactive accounts', pool.students.length === 6,
  `${pool.students.length} students`)
check('getStudentPool — track filters from real skill categories',
  pool.filters[0] === 'All' && pool.filters.at(-1) === 'Available Now',
  pool.filters.join(' | '))
check('getStudentPool — engagement stats ordered as the reference draws them',
  pool.students[0].stats.map((stat) => stat.label).join(', ') ===
    'Per week, Engagements, Projects done',
  pool.students[0].stats.map((stat) => stat.label).join(', '))

const mentorship = await forge.getMentorship()
check('getMentorship — open requests only', mentorship.requests.length === 2,
  `${mentorship.requests.length} of 3 total`)
// Not an exact count any more: the alumni intake (migration 005 plus
// scripts/import-alumni-mentors.mjs) adds seventy mentors on an installation
// that has run it and none on one that has not. What must hold either way is
// that the roster returns every seeded mentor, primary first.
check('getMentorship — full mentor roster', mentorship.mentors.length >= 7 &&
  mentorship.mentors[0].name === 'Mihir Pawar',
  `${mentorship.mentors.length} mentors, first is ${mentorship.mentors[0]?.name}`)
check('getMentorship — mentors carry their skills',
  mentorship.mentors.every((mentor) => Array.isArray(mentor.skills)))
check('getMentorship — session log covers every session',
  mentorship.sessionLog.length === 6, `${mentorship.sessionLog.length} sessions`)
check('getMentorship — a session names both parties',
  mentorship.sessionLog[0].title.includes(' with '), mentorship.sessionLog[0].title)
check('getMentorship — mobile cards flag who is already matched',
  mentorship.mobileAssignments.some((row) => row.assigned) &&
    mentorship.mobileAssignments.some((row) => !row.assigned),
  mentorship.mobileAssignments.map((row) => (row.assigned ? 'A' : 'U')).join(''))

const incubation = await forge.getIncubation()
check('getIncubation — every application listed', incubation.applications.length === 4)
check('getIncubation — access reflects the grant, not the status',
  incubation.applications.filter((application) => application.granted).length === 2,
  incubation.applications.filter((a) => a.granted).map((a) => a.founder).join(', '))

const listings = await forge.getListings()
check('getListings — every listing', listings.rows.length === 7)
check('getListings — counts derived from the rows',
  listings.counts.map((count) => count.label).join(' | ') === '3 Live | 3 Pending | 1 Rejected',
  listings.counts.map((count) => count.label).join(' | '))

const projects = await forge.getProjects()
check('getProjects — includes startups awaiting approval, unlike the student view',
  projects.projects.length === 4, `${projects.projects.length} startups`)
check('getProjects — founder shown in short form',
  projects.projects.some((project) => project.founder === 'Shantanu G.'),
  projects.projects.map((project) => project.founder).join(', '))
check('getProjects — featured comes from the database',
  projects.projects.filter((project) => project.featured).length === 1)

const contacts = await forge.getContacts()
check('getContacts — platform-wide, not founder-scoped', contacts.rows.length === 5,
  `${contacts.rows.length} contacts`)
check('getContacts — 4 stat cards', contacts.stats.length === 4)
check('getContacts — the Forge Manager is CC’d on every one',
  contacts.rows.every((row) => row.ccd === 'Mihir Pawar'))

const contracts = await forge.getContracts()
check('getContracts — reads contracts, not contacts', contracts.rows.length === 3,
  `${contracts.rows.length} contracts`)
check('getContracts — engagement status vocabulary',
  contracts.rows.some((row) => row.status === 'Ongoing') &&
    contracts.rows.some((row) => row.status === 'Done'),
  contracts.rows.map((row) => row.status).join(', '))

const needs = await forge.getPostedNeeds()
check('getPostedNeeds — platform-wide', needs.needs.length === 3)

const logs = await forge.getPlatformLogs()
check('getPlatformLogs — the audit trail', logs.logs.length === 10, `${logs.logs.length} entries`)
check('getPlatformLogs — each entry names its actor',
  logs.logs.every((log) => log.meta.startsWith('By ')), logs.logs[0]?.meta)

const users = await forge.getUsers()
check('getUsers — every account', users.accounts.length === 15)
// Shantanu holds founder *and* backend-manager, and is described by the
// higher standing — the same rule the Backend Manager's directory uses, so the
// two screens cannot disagree about the same person.
check('getUsers — founders read as unlocked',
  users.accounts.filter((account) => account.role === 'Founder Unlocked').length === 1,
  users.accounts.filter((a) => a.role === 'Founder Unlocked').map((a) => a.name).join(', '))
check('getUsers — a manager who is also a founder reads as their manager role',
  users.accounts.find((account) => account.appId === 'ATL-2022-0012')?.role === 'Backend Manager',
  users.accounts.find((account) => account.appId === 'ATL-2022-0012')?.role)
check('getUsers — the inactive account is shown as inactive',
  users.accounts.find((account) => account.name === 'Kavya Reddy')?.status === 'Inactive')
check('getUsers — a founder’s mobile row names their startup',
  users.accounts.some((account) => account.mobileRole === 'Founder · EduTrack'),
  users.accounts.filter((a) => a.group === 'Founders').map((a) => a.mobileRole).join(', '))

/* -------------------------------------------------------------------------- */
/* Writes — each one made, verified, then reversed                            */
/* -------------------------------------------------------------------------- */

// ---- approving a listing ---------------------------------------------------
const pendingListing = queue.items.find((item) => !item.decision && item.kind === 'job')
const beforeStatus = await queryValue('SELECT status FROM listings WHERE id = ?', [
  pendingListing.listingId,
])

await forge.decideListing(mihir, { listingId: pendingListing.listingId, decision: 'approved' })

const afterStatus = await queryValue('SELECT status FROM listings WHERE id = ?', [
  pendingListing.listingId,
])
check('decideListing — the listing goes live', afterStatus === 'live', `${beforeStatus} → ${afterStatus}`)

const decisionRow = await queryOne(
  `SELECT a.decision, a.is_override, r.slug
     FROM approvals a JOIN roles r ON r.id = a.decided_as_role_id
    WHERE a.listing_id = ?`,
  [pendingListing.listingId]
)
check('decideListing — recorded as the Forge Manager',
  decisionRow.decision === 'approved' && decisionRow.slug === 'forge-manager',
  `${decisionRow.decision} as ${decisionRow.slug}`)
check('decideListing — not marked as an override', Number(decisionRow.is_override) === 0)

const notified = await queryValue(
  "SELECT COUNT(*) FROM notifications WHERE entity_type = 'listing' AND entity_id = ?",
  [pendingListing.listingId]
)
check('decideListing — the founder is notified', Number(notified) === 1)

const audited = await queryValue(
  "SELECT COUNT(*) FROM activity_logs WHERE entity_type = 'listing' AND entity_id = ? AND actor_user_id = ?",
  [pendingListing.listingId, mihir.id]
)
check('decideListing — written to the audit trail', Number(audited) === 1)

const badDecision = await forge
  .decideListing(mihir, { listingId: pendingListing.listingId, decision: 'maybe' })
  .then(() => null)
  .catch((error) => error)
check('decideListing — an unknown verdict is refused',
  badDecision?.constructor?.name === 'ValidationError')

const noListing = await forge
  .decideListing(mihir, { listingId: 'abc', decision: 'approved' })
  .then(() => null)
  .catch((error) => error)
check('decideListing — a non-numeric listing id is refused',
  noListing?.constructor?.name === 'ValidationError')

const missingListing = await forge
  .decideListing(mihir, { listingId: 999999, decision: 'approved' })
  .then(() => null)
  .catch((error) => error)
check('decideListing — a listing that does not exist is 404',
  missingListing?.constructor?.name === 'NotFoundError')

// Reverse it.
await execute('DELETE FROM approvals WHERE listing_id = ?', [pendingListing.listingId])
await execute('UPDATE listings SET status = ? WHERE id = ?', [beforeStatus, pendingListing.listingId])
await execute(
  "DELETE FROM notifications WHERE entity_type = 'listing' AND entity_id = ? AND user_id <> 0",
  [pendingListing.listingId]
)
await execute(
  "DELETE FROM activity_logs WHERE entity_type = 'listing' AND entity_id = ? AND actor_user_id = ?",
  [pendingListing.listingId, mihir.id]
)

// ---- assigning a mentor ----------------------------------------------------
const openRequest = mentorship.requests[0]
const mentorChoice = mentorship.mentors[0]
const sessionsBefore = await queryValue('SELECT COUNT(*) FROM mentorship_sessions')

await forge.assignMentor(mihir, {
  requestId: openRequest.requestId,
  mentorId: mentorChoice.mentorId,
  scheduledAt: '2026-09-01T10:00:00Z',
})

const requestStatus = await queryValue('SELECT status FROM mentorship_requests WHERE id = ?', [
  openRequest.requestId,
])
check('assignMentor — the request is closed', requestStatus === 'assigned', requestStatus)

const sessionsAfter = await queryValue('SELECT COUNT(*) FROM mentorship_sessions')
check('assignMentor — a scheduled session is created',
  Number(sessionsAfter) === Number(sessionsBefore) + 1,
  `${sessionsBefore} → ${sessionsAfter}`)

const studentNotified = await queryValue(
  "SELECT COUNT(*) FROM notifications WHERE entity_type = 'mentorship_request' AND entity_id = ?",
  [openRequest.requestId]
)
check('assignMentor — the student is notified', Number(studentNotified) === 1)

const badMentor = await forge
  .assignMentor(mihir, { requestId: openRequest.requestId, mentorId: 'x' })
  .then(() => null)
  .catch((error) => error)
check('assignMentor — a non-numeric mentor id is refused',
  badMentor?.constructor?.name === 'ValidationError')

const unknownMentor = await forge
  .assignMentor(mihir, { requestId: openRequest.requestId, mentorId: 999999 })
  .then(() => null)
  .catch((error) => error)
check('assignMentor — a mentor who does not exist is 404',
  unknownMentor?.constructor?.name === 'NotFoundError')

// Reverse it.
await execute(
  'DELETE FROM mentorship_sessions WHERE request_id = ? AND assigned_by = ?',
  [openRequest.requestId, mihir.id]
)
await execute('UPDATE mentorship_requests SET status = ? WHERE id = ?', [
  'requested',
  openRequest.requestId,
])
await execute(
  "DELETE FROM notifications WHERE entity_type = 'mentorship_request' AND entity_id = ?",
  [openRequest.requestId]
)
await execute(
  "DELETE FROM activity_logs WHERE entity_type = 'mentorship_request' AND entity_id = ? AND actor_user_id = ?",
  [openRequest.requestId, mihir.id]
)

// ---- granting founder access ----------------------------------------------
const ungranted = incubation.applications.find((application) => !application.granted)
const applicantId = await queryValue(
  'SELECT applicant_user_id FROM incubation_applications WHERE id = ?',
  [ungranted.applicationId]
)

await forge.grantFounderAccess(mihir, { applicationId: ungranted.applicationId })

const applicationStatus = await queryValue(
  'SELECT status FROM incubation_applications WHERE id = ?',
  [ungranted.applicationId]
)
check('grantFounderAccess — the application is approved', applicationStatus === 'approved',
  applicationStatus)

const grantRow = await queryValue(
  'SELECT COUNT(*) FROM founder_access_grants WHERE incubation_application_id = ? AND revoked_at IS NULL',
  [ungranted.applicationId]
)
check('grantFounderAccess — a grant is recorded', Number(grantRow) === 1)

const roleRow = await queryValue(
  `SELECT COUNT(*) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.slug = 'founder' AND ur.revoked_at IS NULL`,
  [applicantId]
)
check('grantFounderAccess — the founder role is added', Number(roleRow) === 1)

const afterGrant = await forge.getIncubation()
check('grantFounderAccess — the screen now shows access granted',
  afterGrant.applications.find((a) => a.applicationId === ungranted.applicationId)?.granted === true)

const badApplication = await forge
  .grantFounderAccess(mihir, { applicationId: 999999 })
  .then(() => null)
  .catch((error) => error)
check('grantFounderAccess — an application that does not exist is 404',
  badApplication?.constructor?.name === 'NotFoundError')

// Reverse it.
await execute('DELETE FROM founder_access_grants WHERE incubation_application_id = ?', [
  ungranted.applicationId,
])
await execute(
  `DELETE ur FROM user_roles ur JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ? AND r.slug = 'founder'`,
  [applicantId]
)
await execute(
  'UPDATE incubation_applications SET status = ?, reviewed_at = NULL, reviewed_by = NULL WHERE id = ?',
  [ungranted.status === 'Pending' ? 'pending' : 'under_review', ungranted.applicationId]
)
await execute("DELETE FROM notifications WHERE type = 'access' AND user_id = ?", [applicantId])
await execute(
  "DELETE FROM activity_logs WHERE entity_type = 'incubation_application' AND entity_id = ? AND actor_user_id = ?",
  [ungranted.applicationId, mihir.id]
)

// ---- featuring a startup ---------------------------------------------------
const unfeatured = projects.projects.find((project) => !project.featured)
await forge.setFeatured(mihir, { startupId: unfeatured.startupId, featured: true })
const featuredNow = await queryValue('SELECT is_featured FROM startups WHERE id = ?', [
  unfeatured.startupId,
])
check('setFeatured — the flag is written', Number(featuredNow) === 1)

await forge.setFeatured(mihir, { startupId: unfeatured.startupId, featured: false })
const featuredAgain = await queryValue('SELECT is_featured FROM startups WHERE id = ?', [
  unfeatured.startupId,
])
check('setFeatured — and can be turned off again', Number(featuredAgain) === 0)

await execute(
  "DELETE FROM activity_logs WHERE entity_type = 'startup' AND entity_id = ? AND actor_user_id = ?",
  [unfeatured.startupId, mihir.id]
)

/* -------------------------------------------------------------------------- */
/* The seeded state must be exactly as it started                             */
/* -------------------------------------------------------------------------- */

const after = await forge.getApprovalQueue()
check('reversal — the approval queue is back to its seeded shape',
  after.tabs[0] === queue.tabs[0] && after.items.filter((i) => i.decision).length === 4,
  after.tabs[0])

const afterMentorship = await forge.getMentorship()
check('reversal — mentorship is back to its seeded shape',
  afterMentorship.requests.length === 2 && afterMentorship.sessionLog.length === 6,
  `${afterMentorship.requests.length} requests, ${afterMentorship.sessionLog.length} sessions`)

const afterIncubation = await forge.getIncubation()
check('reversal — incubation grants are back to two',
  afterIncubation.applications.filter((a) => a.granted).length === 2)

const afterLogs = await forge.getPlatformLogs()
check('reversal — no audit rows left behind', afterLogs.logs.length === 10,
  `${afterLogs.logs.length} entries`)

/* -------------------------------------------------------------------------- */
/* Presenter, as pure functions                                               */
/* -------------------------------------------------------------------------- */

check('presenter — short names', present.shortName('Shantanu Ghuriani') === 'Shantanu G.')
check('presenter — a single-word name survives', present.shortName('Prince') === 'Prince')
check('presenter — an account with no roles says so',
  present.toUserAccount({ id: 1, name: 'A B', roleSlugs: [], status: 'active' }).role ===
    'No role assigned')
check('presenter — and is not filed under Students',
  present.toUserAccount({ id: 1, name: 'A B', roleSlugs: [], status: 'active' }).group ===
    'Unassigned')
check('presenter — a founder is matched by slug, not by display name',
  present.toUserAccount({
    id: 1, name: 'A B', status: 'active',
    roleNames: ['Founder (Startup)'], roleSlugs: ['founder'],
  }).role === 'Founder Unlocked')
check('presenter — an unknown listing status does not crash',
  present.toListingRow({ id: 1, status: 'nonsense', skills: [] }).status === '—')

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

await closePool()
process.exit(fail.length === 0 ? 0 : 1)
