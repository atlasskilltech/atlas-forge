/**
 * End-to-end verification of the Founder HTTP surface.
 *
 *   npm run test:founder:api          (expects a server on $BASE_URL)
 *
 * Signs in over HTTP exactly as a browser would and checks both the JSON
 * routes and the server-rendered pages, including that one role cannot reach
 * another's data.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
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

console.log(`\nATLAS Forge — Founder API verification (${BASE})\n`)

// Captured before any write so the teardown removes exactly what this run adds.
const mysqlEarly = (await import('mysql2/promise')).default
const marks = await mysqlEarly.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})
const [[highWater]] = await marks.execute(`
  SELECT COALESCE((SELECT MAX(id) FROM application_events), 0) AS events,
         COALESCE((SELECT MAX(id) FROM notifications), 0)      AS notifications,
         COALESCE((SELECT MAX(id) FROM activity_logs), 0)      AS activity
`)
await marks.end()
const eventHighWater = highWater.events
const notificationHighWater = highWater.notifications
const activityHighWater = highWater.activity


/* -------------------------------------------------------------------------- */
/* Anonymous                                                                  */
/* -------------------------------------------------------------------------- */

const anonPage = await call('/founder/home')
check(
  'anonymous founder page gets a real 307 to login',
  anonPage.status === 307 && (anonPage.headers.get('location') ?? '').includes('/login'),
  `${anonPage.status} → ${anonPage.headers.get('location')}`
)
check('anonymous founder API is 401', (await call('/api/founder/home')).status === 401)

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const shantanu = await signIn(FOUNDER)

const session = await json(await call('/api/auth/session', { cookies: shantanu }))
check('a multi-role account resolves both roles', session?.data?.roles?.length === 2,
  session?.data?.roles?.map((role) => role.slug).join(' + '))

const home = await json(await call('/api/founder/home', { cookies: shantanu }))
check('GET /api/founder/home', home?.ok === true && home.data.stats.length === 5)
check('home names the founder’s startup', home?.data?.stats[0].value === 'NovaMed')
check('activity feed carries other people’s actions',
  new Set(home?.data?.mobileActivity.map((row) => row.initials)).size > 1,
  home?.data?.mobileActivity.map((row) => row.initials).join(', '))

const concierge = await json(await call('/api/founder/concierge', { cookies: shantanu }))
check('GET /api/founder/concierge', concierge?.data?.students?.length === 6)

const contacts = await json(await call('/api/founder/contacts', { cookies: shantanu }))
check('GET /api/founder/contacts is founder-scoped', contacts?.data?.contacts?.length === 3)

const hiring = await json(await call('/api/founder/hiring', { cookies: shantanu }))
check('GET /api/founder/hiring returns all four tabs',
  Object.keys(hiring?.data?.listingsByTab ?? {}).length === 4)

const startup = await json(await call('/api/founder/startup', { cookies: shantanu }))
check('GET /api/founder/startup', startup?.data?.startup?.team?.length === 3)

const projects = await json(await call('/api/founder/projects', { cookies: shantanu }))
check('GET /api/founder/projects flags the caller’s own',
  projects?.data?.projects?.filter((project) => project.mine).length === 1)

const applicants = await json(await call('/api/founder/applicants', { cookies: shantanu }))
check('GET /api/founder/applicants', applicants?.data?.listings?.length === 3)

const mentorship = await json(await call('/api/founder/mentorship', { cookies: shantanu }))
check('GET /api/founder/mentorship', mentorship?.data?.sessions?.length === 2)

const incubation = await json(await call('/api/founder/incubation', { cookies: shantanu }))
check('GET /api/founder/incubation', Boolean(incubation?.data?.draft))

const needs = await json(await call('/api/founder/needs', { cookies: shantanu }))
check('GET /api/founder/needs is founder-scoped', needs?.data?.needs?.length === 1)

const jobOptions = await json(await call('/api/founder/listings', { cookies: shantanu }))
check('GET /api/founder/listings returns the form options',
  jobOptions?.data?.contractTypes?.length === 4)

/* -------------------------------------------------------------------------- */
/* Server-rendered pages                                                      */
/* -------------------------------------------------------------------------- */

for (const [path, needle] of [
  ['/founder/home', 'Welcome back, Shantanu'],
  ['/founder/profile', 'Founder Unlocked'],
  ['/founder/startup', 'Early Traction'],
  ['/founder/concierge', 'Riya Kapoor'],
  ['/founder/contact-log', 'Mihir Pawar'],
  ['/founder/hiring', 'UI/UX Designer'],
  ['/founder/listings', 'Marketing Lead'],
  ['/founder/projects', 'NovaMed'],
  ['/founder/mentorship', 'Mihir Pawar'],
  ['/founder/applicants', 'Applicants'],
  ['/founder/edit-listing', 'NovaMed'],
  ['/founder/post-job', 'Paid Freelance'],
  ['/founder/application', 'NovaMed'],
  ['/founder/posted-needs', 'Posted'],
]) {
  const response = await call(path, { cookies: shantanu })
  const html = await text(response)
  check(`page ${path} renders from MySQL`, response.status === 200 && html.includes(needle), needle)
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

const contacted = await call('/api/founder/contacts', {
  method: 'POST',
  body: { studentId: concierge.data.students.find((s) => s.name === 'Anjali Rao').userId,
          context: 'API verification outreach' },
  cookies: shantanu,
})
const contactedBody = await json(contacted)
check('POST a Service contact is 201', contacted.status === 201, String(contacted.status))

const afterContact = await json(await call('/api/founder/contacts', { cookies: shantanu }))
check('the contact appears in the log immediately', afterContact.data.contacts.length === 4)
check('and is recorded as CC’d to the Forge Manager',
  afterContact.data.contacts[0].ccd === 'Mihir Pawar', afterContact.data.contacts[0].ccd)

const badContact = await call('/api/founder/contacts', {
  method: 'POST',
  body: { studentId: 'nope' },
  cookies: shantanu,
})
check('a malformed student id is 422', badContact.status === 422, String(badContact.status))

const missingStudent = await call('/api/founder/contacts', {
  method: 'POST',
  body: { studentId: 999999, context: 'x' },
  cookies: shantanu,
})
check('contacting a student who does not exist is 404', missingStudent.status === 404,
  String(missingStudent.status))

const posted = await call('/api/founder/listings', {
  method: 'POST',
  body: {
    title: '__api_probe__ Test Role',
    description: 'Created by the founder API verification run.',
    roleType: 'Contract',
    contractType: 'paid-freelance',
    skills: 'React',
  },
  cookies: shantanu,
})
const postedBody = await json(posted)
check('POST a job listing is 201', posted.status === 201, String(posted.status))

const afterPost = await json(await call('/api/founder/hiring', { cookies: shantanu }))
const probe = afterPost.data.listingsByTab['My Listings'].find((listing) =>
  listing.title.startsWith('__api_probe__')
)
check('the new listing appears under My Listings awaiting approval',
  probe?.status === 'Pending Approval', probe?.status)
check('and its free-typed role type resolved', probe?.type === 'Contract', probe?.type)

const blankTitle = await call('/api/founder/listings', {
  method: 'POST',
  body: { title: '   ' },
  cookies: shantanu,
})
check('a blank job title is 422', blankTitle.status === 422, String(blankTitle.status))

/* -------------------------------------------------------------------------- */
/* The hiring pipeline over HTTP                                              */
/* -------------------------------------------------------------------------- */

const riyaJar = await signIn(STUDENT)
const applicantsBody = await json(await call('/api/founder/applicants', { cookies: shantanu }))
const withApplicants = applicantsBody.data.listings.find(
  (listing) => listing.applicants.length > 0
)
const applicant = withApplicants.applicants.find((row) => row.rawStatus === 'under_review')
check('an applicant row carries its current status', Boolean(applicant),
  withApplicants.applicants.map((row) => row.status).join(', '))

const advanced = await call('/api/founder/applicants', {
  method: 'PATCH',
  body: { applicationId: applicant.applicationId, status: 'shortlisted' },
  cookies: shantanu,
})
check('PATCH advancing an applicant is 200', advanced.status === 200, String(advanced.status))

const studentAfter = await json(await call('/api/student/applications', { cookies: riyaJar }))
const studentRow = studentAfter.data.applications.find(
  (row) => row.applicationId === applicant.applicationId
)
check('the student sees the new status at once', studentRow?.status === 'Shortlisted',
  studentRow?.status)

const backwards = await call('/api/founder/applicants', {
  method: 'PATCH',
  body: { applicationId: applicant.applicationId, status: 'under_review' },
  cookies: shantanu,
})
check('moving the pipeline backwards is 409', backwards.status === 409, String(backwards.status))

const withdrawByFounder = await call('/api/founder/applicants', {
  method: 'PATCH',
  body: { applicationId: applicant.applicationId, status: 'withdrawn' },
  cookies: shantanu,
})
check('a founder cannot withdraw for the student', withdrawByFounder.status === 422,
  String(withdrawByFounder.status))

const unknownApplication = await call('/api/founder/applicants', {
  method: 'PATCH',
  body: { applicationId: 999999, status: 'shortlisted' },
  cookies: shantanu,
})
check('an application that does not exist is 404', unknownApplication.status === 404,
  String(unknownApplication.status))

check('a student cannot move their own application forward',
  (await call('/api/founder/applicants', {
    method: 'PATCH',
    body: { applicationId: applicant.applicationId, status: 'selected' },
    cookies: riyaJar,
  })).status === 403)

// Put it back where the seed had it.
const restored = await call('/api/founder/applicants', {
  method: 'PATCH',
  body: { applicationId: applicant.applicationId, status: 'selected' },
  cookies: shantanu,
})
check('and the founder can carry it through to Selected', restored.status === 200,
  String(restored.status))

/* -------------------------------------------------------------------------- */
/* Role isolation                                                             */
/* -------------------------------------------------------------------------- */

const riya = await signIn(STUDENT)

check('a student cannot read the founder API',
  (await call('/api/founder/home', { cookies: riya })).status === 403)

const studentOnFounderPage = await call('/founder/home', { cookies: riya })
const studentHtml = await text(studentOnFounderPage)
check('a student is redirected away from founder pages',
  redirectsTo(studentOnFounderPage, studentHtml, '/select-role'),
  `${studentOnFounderPage.status}`)
check('and never sees the founder’s startup on the way',
  !studentHtml.includes('Welcome back, Shantanu'))

check('a founder cannot read the student API',
  (await call('/api/student/home', { cookies: shantanu })).status === 403)

const applicantNames = applicants.data.listings.flatMap((listing) =>
  listing.applicants.map((applicant) => applicant.name)
)
check('applicants are only ever the founder’s own listings’',
  applicantNames.length > 0,
  `${applicantNames.length} across ${applicants.data.listings.length} listings`)

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

if (postedBody?.data?.listingId) {
  await connection.execute('DELETE FROM listing_skills WHERE listing_id = ?', [
    postedBody.data.listingId,
  ])
  await connection.execute('DELETE FROM listings WHERE id = ?', [postedBody.data.listingId])
}
if (contactedBody?.data?.contactId) {
  await connection.execute(
    "DELETE FROM notifications WHERE entity_type = 'concierge_contact' AND entity_id = ?",
    [contactedBody.data.contactId]
  )
  await connection.execute('DELETE FROM concierge_contacts WHERE id = ?', [
    contactedBody.data.contactId,
  ])
}
await connection.execute("DELETE FROM activity_logs WHERE action LIKE '%__api_probe__%'")
await connection.execute("DELETE FROM activity_logs WHERE action = 'Contacted Anjali Rao via Service'")

// The pipeline moves: return the application to the status the seed set, and
// drop the history, notifications and audit rows those moves produced.
if (applicant?.applicationId) {
  await connection.execute("UPDATE applications SET status = 'under_review' WHERE id = ?", [
    applicant.applicationId,
  ])
  await connection.execute(
    'DELETE FROM application_events WHERE application_id = ? AND id > ?',
    [applicant.applicationId, eventHighWater]
  )
  await connection.execute(
    "DELETE FROM notifications WHERE entity_type = 'application' AND entity_id = ? AND id > ?",
    [applicant.applicationId, notificationHighWater]
  )
  await connection.execute(
    "DELETE FROM activity_logs WHERE entity_type = 'application' AND entity_id = ? AND id > ?",
    [applicant.applicationId, activityHighWater]
  )
}

const [[counts]] = await connection.execute(`
  SELECT (SELECT COUNT(*) FROM listings WHERE title LIKE '__api_probe__%') AS probes,
         (SELECT COUNT(*) FROM concierge_contacts)                         AS contacts,
         (SELECT COUNT(*) FROM application_events)                         AS events,
         (SELECT COUNT(*) FROM activity_logs)                              AS activity
`)
await connection.end()

check('teardown — seeded data restored',
  Number(counts.probes) === 0 && Number(counts.contacts) === 5 &&
    Number(counts.events) === 10 && Number(counts.activity) === 10,
  `probes=${counts.probes} contacts=${counts.contacts} events=${counts.events} activity=${counts.activity}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
