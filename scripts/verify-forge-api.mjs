/**
 * End-to-end verification of the Forge Manager HTTP surface.
 *
 *   npm run test:forge:api          (expects a server on $BASE_URL)
 *
 * The decisions this module makes are the ones other roles depend on, so each
 * write is checked from the far side too: a listing approved here must become
 * visible to a student, and a grant made here must unlock the founder area.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const MANAGER = 'ATL-2020-0001'
const FOUNDER = 'ATL-2022-0012'
const STUDENT = 'ATL-2024-0871'
const PASSWORD = 'Atlas@2026'

const pass = []
const fail = []
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

function jar() {
  const cookies = new Map()
  return {
    header: () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb(response) {
      for (const line of response.headers.getSetCookie?.() ?? []) {
        const [pairText] = line.split(';')
        const index = pairText.indexOf('=')
        const name = pairText.slice(0, index).trim()
        const value = pairText.slice(index + 1).trim()
        if (value === '') cookies.delete(name)
        else cookies.set(name, value)
      }
      return response
    },
  }
}

async function call(path, { method = 'GET', body, cookies, redirect = 'manual' } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    redirect,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookies ? { Cookie: cookies.header() } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (cookies) cookies.absorb(response)
  return response
}

const json = async (response) => response.json().catch(() => null)
const text = async (response) => (await response.text()).replaceAll('<!-- -->', '')

function redirectsTo(response, html, target) {
  if (response.status >= 300 && response.status < 400) {
    return Boolean(response.headers.get('location')?.includes(target))
  }
  return html.includes('NEXT_REDIRECT') && html.includes(target)
}

async function signIn(appId) {
  const cookies = jar()
  await call('/api/auth/login', { method: 'POST', body: { appId, password: PASSWORD }, cookies })
  return cookies
}

console.log(`\nATLAS Forge — Forge Manager API verification (${BASE})\n`)

/* -------------------------------------------------------------------------- */
/* Anonymous                                                                  */
/* -------------------------------------------------------------------------- */

const anonPage = await call('/forge/dashboard')
check('anonymous forge page gets a real 307 to login',
  anonPage.status === 307 && (anonPage.headers.get('location') ?? '').includes('/login'),
  `${anonPage.status}`)
check('anonymous forge API is 401', (await call('/api/forge/dashboard')).status === 401)

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const mihir = await signIn(MANAGER)

const dashboard = await json(await call('/api/forge/dashboard', { cookies: mihir }))
check('GET /api/forge/dashboard', dashboard?.ok === true && dashboard.data.stats.length === 5)
check('the queue preview mixes listings and mentor requests',
  new Set(dashboard.data.queue.map((row) => row.initial)).size > 1,
  dashboard.data.queue.map((row) => row.initial).join(''))

const queue = await json(await call('/api/forge/approvals', { cookies: mihir }))
check('GET /api/forge/approvals', queue?.data?.items?.length === 7)
check('tab labels carry live counts', queue?.data?.tabs[0] === 'All (3)', queue?.data?.tabs[0])

for (const [path, key, expected] of [
  ['/api/forge/student-pool', 'students', 6],
  ['/api/forge/listings', 'rows', 7],
  ['/api/forge/projects', 'projects', 4],
  ['/api/forge/contacts', 'rows', 5],
  ['/api/forge/contracts', 'rows', 3],
  ['/api/forge/needs', 'needs', 3],
  ['/api/forge/logs', 'logs', 10],
  ['/api/forge/users', 'accounts', 15],
]) {
  const body = await json(await call(path, { cookies: mihir }))
  check(`GET ${path}`, body?.data?.[key]?.length === expected,
    `${body?.data?.[key]?.length} of ${expected}`)
}

const mentorship = await json(await call('/api/forge/mentorship', { cookies: mihir }))
check('GET /api/forge/mentorship', mentorship?.data?.requests?.length === 2)

const incubation = await json(await call('/api/forge/incubation', { cookies: mihir }))
check('GET /api/forge/incubation', incubation?.data?.applications?.length === 4)

/* -------------------------------------------------------------------------- */
/* Server-rendered pages                                                      */
/* -------------------------------------------------------------------------- */

for (const [path, needle] of [
  ['/forge/dashboard', 'Total Students'],
  ['/forge/approval-queue', 'All (3)'],
  ['/forge/applications', 'NovaMed'],
  ['/forge/assign-mentors', 'Pending Requests (2)'],
  ['/forge/session-log', 'Mihir Pawar'],
  ['/forge/student-pool', 'Riya Kapoor'],
  ['/forge/listings', 'UI/UX Designer'],
  ['/forge/projects', 'NovaMed'],
  ['/forge/active-startups', 'EduTrack'],
  ['/forge/featured', 'NovaMed'],
  ['/forge/contact-log', 'Mihir Pawar'],
  ['/forge/contract-log', 'Brand identity engagement'],
  ['/forge/posted-needs', 'UI Designer for patient onboarding'],
  ['/forge/platform-logs', 'Granted Founder access'],
  ['/forge/user-accounts', 'Founder Unlocked'],
  ['/forge/students', 'Riya Kapoor'],
  ['/forge/founders', 'Shantanu Ghuriani'],
  ['/forge/role-assignments', 'ATL-2020-0001'],
]) {
  const response = await call(path, { cookies: mihir })
  const html = await text(response)
  check(`page ${path} renders from MySQL`, response.status === 200 && html.includes(needle), needle)
}

/* -------------------------------------------------------------------------- */
/* Writes, and their effect on the other roles                                */
/* -------------------------------------------------------------------------- */

// ---- approving a listing makes it visible to students ----------------------
const undecided = queue.data.items.find((item) => !item.decision && item.kind === 'job')
const riya = await signIn(STUDENT)
const jobsBefore = await json(await call('/api/student/jobs', { cookies: riya }))

const approved = await call('/api/forge/approvals', {
  method: 'POST',
  body: { listingId: undecided.listingId, decision: 'approved' },
  cookies: mihir,
})
check('POST an approval is 200', approved.status === 200, String(approved.status))

const jobsAfter = await json(await call('/api/student/jobs', { cookies: riya }))
check('the approved listing now reaches the student browse screen',
  jobsAfter.data.jobs.length === jobsBefore.data.jobs.length + 1,
  `${jobsBefore.data.jobs.length} → ${jobsAfter.data.jobs.length}`)
check('and it is the listing that was approved',
  jobsAfter.data.jobs.some((job) => job.listingId === undecided.listingId))

const queueAfter = await json(await call('/api/forge/approvals', { cookies: mihir }))
check('the queue count drops by one', queueAfter.data.tabs[0] === 'All (2)',
  queueAfter.data.tabs[0])

const badDecision = await call('/api/forge/approvals', {
  method: 'POST',
  body: { listingId: undecided.listingId, decision: 'maybe' },
  cookies: mihir,
})
check('an unknown verdict is 422', badDecision.status === 422, String(badDecision.status))

const missing = await call('/api/forge/approvals', {
  method: 'POST',
  body: { listingId: 999999, decision: 'approved' },
  cookies: mihir,
})
check('a listing that does not exist is 404', missing.status === 404, String(missing.status))

// ---- assigning a mentor reaches the student's own screen -------------------
const openRequest = mentorship.data.requests.find(
  (request) => request.title.includes('Riya')
)
const studentMentorshipBefore = await json(await call('/api/student/mentorship', { cookies: riya }))

const assigned = await call('/api/forge/mentorship', {
  method: 'POST',
  body: {
    requestId: openRequest.requestId,
    mentorId: mentorship.data.mentors[0].mentorId,
    scheduledAt: '2026-09-15T09:30:00Z',
  },
  cookies: mihir,
})
check('POST a mentor assignment is 200', assigned.status === 200, String(assigned.status))

const studentMentorshipAfter = await json(await call('/api/student/mentorship', { cookies: riya }))
check('the student sees the new session immediately',
  studentMentorshipAfter.data.sessions.length ===
    studentMentorshipBefore.data.sessions.length + 1,
  `${studentMentorshipBefore.data.sessions.length} → ${studentMentorshipAfter.data.sessions.length}`)

// ---- granting founder access unlocks the founder area ----------------------
const ungranted = incubation.data.applications.find((application) => !application.granted)
const applicantAppId = 'ATL-2021-0119' // Priya Shah — GreenGrid, pending
const priyaBefore = await signIn(applicantAppId)
check('the applicant cannot reach the founder API before the grant',
  (await call('/api/founder/home', { cookies: priyaBefore })).status === 403)

const granted = await call('/api/forge/incubation', {
  method: 'POST',
  body: { applicationId: ungranted.applicationId },
  cookies: mihir,
})
check('POST a founder grant is 200', granted.status === 200, String(granted.status))

// A fresh sign-in is not needed: roles are re-read from the database on every
// request, so the existing session gains the role immediately.
const priyaAfter = await call('/api/founder/home', { cookies: priyaBefore })
check('the existing session gains founder access without signing in again',
  priyaAfter.status === 200, String(priyaAfter.status))

const priyaHome = await json(priyaAfter)
check('and the founder dashboard names their startup',
  priyaHome?.data?.stats[0].value === 'GreenGrid', priyaHome?.data?.stats[0].value)

// ---- featuring -------------------------------------------------------------
const projects = await json(await call('/api/forge/projects', { cookies: mihir }))
const toFeature = projects.data.projects.find((project) => !project.featured)
const featured = await call('/api/forge/projects', {
  method: 'PATCH',
  body: { startupId: toFeature.startupId, featured: true },
  cookies: mihir,
})
check('PATCH featuring a startup is 200', featured.status === 200, String(featured.status))

const afterFeature = await json(await call('/api/forge/projects', { cookies: mihir }))
check('the startup now reads as featured',
  afterFeature.data.projects.find((project) => project.startupId === toFeature.startupId)
    ?.featured === true)

/* -------------------------------------------------------------------------- */
/* Role isolation                                                             */
/* -------------------------------------------------------------------------- */

const shantanu = await signIn(FOUNDER)
check('a founder cannot read the forge API',
  (await call('/api/forge/dashboard', { cookies: shantanu })).status === 403)
// Shantanu is a founder *and* a Backend Manager, so he holds
// `listing.approve`. He must still be refused here: this endpoint files every
// verdict as the Forge Manager, and a Backend Manager override belongs in the
// Backend module against its own role.
check('an account holding listing.approve but not the role is still refused here',
  (await call('/api/forge/approvals', {
    method: 'POST',
    body: { listingId: undecided.listingId, decision: 'approved' },
    cookies: shantanu,
  })).status === 403)
check('and likewise for mentor assignment',
  (await call('/api/forge/mentorship', {
    method: 'POST',
    body: { requestId: openRequest.requestId, mentorId: 1 },
    cookies: shantanu,
  })).status === 403)
check('a student cannot read the forge API',
  (await call('/api/forge/dashboard', { cookies: riya })).status === 403)

const founderOnForgePage = await call('/forge/dashboard', { cookies: shantanu })
const founderHtml = await text(founderOnForgePage)
check('a founder is redirected away from forge pages',
  redirectsTo(founderOnForgePage, founderHtml, '/select-role'))
check('and never sees the platform counters on the way',
  !founderHtml.includes('Total Students'))

/* -------------------------------------------------------------------------- */
/* Teardown — restore the seeded demo data                                    */
/* -------------------------------------------------------------------------- */

const mysql = (await import('mysql2/promise')).default
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})
const run = (sql, params = []) => connection.execute(sql, params)

// the approval
await run('DELETE FROM approvals WHERE listing_id = ?', [undecided.listingId])
await run("UPDATE listings SET status = 'pending' WHERE id = ?", [undecided.listingId])
await run("DELETE FROM notifications WHERE entity_type = 'listing' AND entity_id = ?", [
  undecided.listingId,
])
// the assignment
await run('DELETE FROM mentorship_sessions WHERE request_id = ? AND assigned_by IS NOT NULL AND scheduled_at IS NOT NULL AND topic = (SELECT topic FROM mentorship_requests WHERE id = ?)', [
  openRequest.requestId,
  openRequest.requestId,
])
await run("UPDATE mentorship_requests SET status = 'requested' WHERE id = ?", [
  openRequest.requestId,
])
await run("DELETE FROM notifications WHERE entity_type = 'mentorship_request' AND entity_id = ?", [
  openRequest.requestId,
])
// the grant
const [[applicant]] = await connection.execute(
  'SELECT applicant_user_id AS id FROM incubation_applications WHERE id = ?',
  [ungranted.applicationId]
)
await run('DELETE FROM founder_access_grants WHERE incubation_application_id = ?', [
  ungranted.applicationId,
])
await run(
  "DELETE ur FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.slug = 'founder'",
  [applicant.id]
)
await run(
  "UPDATE incubation_applications SET status = 'pending', reviewed_at = NULL, reviewed_by = NULL WHERE id = ?",
  [ungranted.applicationId]
)
await run("DELETE FROM notifications WHERE type = 'access' AND user_id = ?", [applicant.id])
// the feature flag
await run('UPDATE startups SET is_featured = 0 WHERE id = ?', [toFeature.startupId])
// audit rows written by this run
await run(
  "DELETE FROM activity_logs WHERE actor_user_id = (SELECT id FROM users WHERE app_id = ?) AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)",
  [MANAGER]
)

const [[counts]] = await connection.execute(`
  SELECT (SELECT COUNT(*) FROM listings WHERE status = 'pending') AS pending,
         (SELECT COUNT(*) FROM mentorship_sessions)               AS sessions,
         (SELECT COUNT(*) FROM founder_access_grants)             AS grants,
         (SELECT COUNT(*) FROM activity_logs)                     AS activity
`)
await connection.end()

check('teardown — seeded data restored',
  Number(counts.pending) === 3 && Number(counts.sessions) === 6 &&
    Number(counts.grants) === 2 && Number(counts.activity) === 10,
  `pending=${counts.pending} sessions=${counts.sessions} grants=${counts.grants} activity=${counts.activity}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
