/**
 * End-to-end verification of the Student HTTP surface.
 *
 *   npm run test:student:api          (expects a server on $BASE_URL)
 *
 * Talks to a running server over HTTP exactly as a browser would: it signs in
 * through /api/auth/login, keeps the returned cookie, and checks both the JSON
 * routes and the server-rendered pages. Nothing here imports the application —
 * if the session, the guards or the routes are wrong, this fails.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const APP_ID = 'ATL-2024-0871'
const PASSWORD = 'Atlas@2026'

const pass = []
const fail = []
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

/** Minimal cookie jar, so each identity keeps its own session. */
function jar() {
  const cookies = new Map()
  return {
    header: () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
    absorb(response) {
      for (const line of response.headers.getSetCookie?.() ?? []) {
        const [pair] = line.split(';')
        const index = pair.indexOf('=')
        const name = pair.slice(0, index).trim()
        const value = pair.slice(index + 1).trim()
        if (value === '') cookies.delete(name)
        else cookies.set(name, value)
      }
      return response
    },
    raw: () => [...cookies],
    set: (name, value) => cookies.set(name, value),
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

/**
 * React separates a literal from an interpolated value with an empty comment,
 * so "Welcome, {name}" ships as `Welcome, <!-- -->Riya`. Stripping those makes
 * assertions read like the rendered text rather than the transport.
 */
const text = async (response) => (await response.text()).replaceAll('<!-- -->', '')

/**
 * A streamed page cannot send a redirect header once its shell has flushed, so
 * Next records it in the RSC payload instead. Both forms count as a redirect;
 * what matters is where it points.
 */
function redirectsTo(response, html, target) {
  if (response.status >= 300 && response.status < 400) {
    return Boolean(response.headers.get('location')?.includes(target))
  }
  return html.includes('NEXT_REDIRECT') && html.includes(target)
}

console.log(`\nATLAS Forge — Student API verification (${BASE})\n`)

/* -------------------------------------------------------------------------- */
/* Anonymous                                                                  */
/* -------------------------------------------------------------------------- */

const anonPage = await call('/student/home')
check(
  'anonymous page gets a real 307 to login, before any rendering',
  anonPage.status === 307 && (anonPage.headers.get('location') ?? '').includes('/login'),
  `${anonPage.status} → ${anonPage.headers.get('location')}`
)
check(
  'the redirect remembers where the visitor was going',
  (anonPage.headers.get('location') ?? '').includes('next=%2Fstudent%2Fhome')
)

const anonApi = await call('/api/student/home')
const anonApiBody = await json(anonApi)
check('anonymous API is 401', anonApi.status === 401, String(anonApi.status))
check(
  'error envelope is flat, not double-wrapped',
  anonApiBody?.error?.code === 'UNAUTHORIZED' && typeof anonApiBody.error.message === 'string',
  JSON.stringify(anonApiBody)
)

const anonSession = await json(await call('/api/auth/session'))
check('session route reports null when signed out', anonSession?.data === null)

/* -------------------------------------------------------------------------- */
/* Sign-in                                                                    */
/* -------------------------------------------------------------------------- */

const wrong = await call('/api/auth/login', {
  method: 'POST',
  body: { appId: APP_ID, password: 'not-the-password' },
})
check('wrong password is 401', wrong.status === 401, String(wrong.status))

const unknown = await json(
  await call('/api/auth/login', {
    method: 'POST',
    body: { appId: 'ATL-0000-0000', password: PASSWORD },
  })
)
const wrongBody = await json(wrong)
check(
  'unknown account and wrong password are indistinguishable',
  unknown?.error?.message === wrongBody?.error?.message,
  wrongBody?.error?.message
)

const riya = jar()
const login = await call('/api/auth/login', {
  method: 'POST',
  body: { appId: APP_ID, password: PASSWORD },
  cookies: riya,
})
check('correct credentials are 200', login.status === 200, String(login.status))

const setCookie = (login.headers.getSetCookie?.() ?? []).join(' ')
check('session cookie is HttpOnly', /HttpOnly/i.test(setCookie))
check('session cookie is SameSite=Lax', /SameSite=Lax/i.test(setCookie))
check('session cookie is scoped to the whole site', /Path=\//i.test(setCookie))

const loginBody = await json(login)
check('login response carries no password or permissions',
  !JSON.stringify(loginBody).match(/password|permission/i))

const session = await json(await call('/api/auth/session', { cookies: riya }))
check('session resolves the real user', session?.data?.user?.appId === APP_ID)
check('active role is student', session?.data?.activeRole === 'student')

/* -------------------------------------------------------------------------- */
/* Tampering                                                                  */
/* -------------------------------------------------------------------------- */

const forged = jar()
const [[cookieName, cookieValue]] = riya.raw()
const flipped = cookieValue.slice(0, -1) + (cookieValue.at(-1) === 'A' ? 'B' : 'A')
forged.set(cookieName, flipped)
check(
  'a modified signature is rejected',
  (await call('/api/student/home', { cookies: forged })).status === 401
)

const unsigned = jar()
unsigned.set(
  cookieName,
  Buffer.from(JSON.stringify({ uid: 1, role: 'backend-manager', exp: 9999999999 })).toString(
    'base64url'
  )
)
check(
  'a self-made payload without a signature is rejected',
  (await call('/api/student/home', { cookies: unsigned })).status === 401
)

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const home = await json(await call('/api/student/home', { cookies: riya }))
check('GET /api/student/home', home?.ok === true && home.data.stats.length === 4)
check('home stats hold real values', home?.data?.stats[1].value === '2',
  `${home?.data?.stats[1].value} active applications`)

const jobs = await json(await call('/api/student/jobs', { cookies: riya }))
check('GET /api/student/jobs', jobs?.data?.jobs?.length === 3, `${jobs?.data?.jobs?.length} jobs`)

const applications = await json(await call('/api/student/applications', { cookies: riya }))
check('GET /api/student/applications', applications?.data?.applications?.length === 3)

const projects = await json(await call('/api/student/projects', { cookies: riya }))
check('GET /api/student/projects', projects?.data?.projects?.length >= 2)

const mentorship = await json(await call('/api/student/mentorship', { cookies: riya }))
check('GET /api/student/mentorship', mentorship?.data?.sessions?.length === 2)

const incubation = await json(await call('/api/student/incubation', { cookies: riya }))
check('GET /api/student/incubation', incubation?.data?.readinessItems?.length === 4)

const availability = await json(await call('/api/student/availability', { cookies: riya }))
check('GET /api/student/availability', availability?.data?.profile?.skills?.length === 5)
check('skill catalogue served for the picker', availability?.data?.allSkills?.length === 30)

/* -------------------------------------------------------------------------- */
/* Server-rendered pages                                                      */
/* -------------------------------------------------------------------------- */

for (const [path, needle] of [
  ['/student/home', 'Welcome, Riya'],
  ['/student/profile', 'BDes Product Design'],
  ['/student/applications', 'Under Review'],
  ['/student/jobs', 'UI/UX Designer'],
  ['/student/projects', 'NovaMed'],
  ['/student/mentorship', 'Pending Assignment'],
  ['/student/availability', 'Service pool'],
  ['/student/incubation', 'Pitch Deck or Concept Note'],
  ['/student/post-collab', 'Collaboration / No Pay'],
]) {
  const response = await call(path, { cookies: riya })
  const html = await text(response)
  check(`page ${path} renders from MySQL`, response.status === 200 && html.includes(needle), needle)
  check(`page ${path} shows the signed-in student`, html.includes('Riya Kapoor'))
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

// Riya has not applied to Marketing Lead in the seed.
const target = jobs.data.jobs.find((job) => !job.applied)
check('a live listing is still open to apply for', Boolean(target), target?.title)

let createdApplicationId = null
if (target) {
  const applied = await call('/api/student/applications', {
    method: 'POST',
    body: { listingId: target.listingId },
    cookies: riya,
  })
  const appliedBody = await json(applied)
  createdApplicationId = appliedBody?.data?.applicationId ?? null
  check('POST apply is 201', applied.status === 201, String(applied.status))

  const again = await call('/api/student/applications', {
    method: 'POST',
    body: { listingId: target.listingId },
    cookies: riya,
  })
  check('applying twice is 409', again.status === 409, String(again.status))

  const afterApply = await json(await call('/api/student/jobs', { cookies: riya }))
  check(
    'the listing now reads as applied',
    afterApply.data.jobs.find((job) => job.id === target.id)?.applied === true
  )

  const removed = await call(`/api/student/applications/${createdApplicationId}`, {
    method: 'DELETE',
    cookies: riya,
  })
  check('withdraw is 200', removed.status === 200, String(removed.status))

  // Withdrawing does not delete the row — the unique key on
  // (listing_id, applicant_user_id) still stands, so the listing correctly
  // keeps reading as applied. The row is removed in the teardown below so the
  // demo data is exactly as seeded and the script can run again.
  const afterWithdraw = await json(await call('/api/student/jobs', { cookies: riya }))
  check(
    'a withdrawn application still blocks a second attempt',
    afterWithdraw.data.jobs.find((job) => job.id === target.id)?.applied === true
  )
}

// ---- Contact Forge Manager -------------------------------------------------
const messaged = await call('/api/messages', {
  method: 'POST',
  body: { subject: '__api_probe__ Question', message: 'Does this actually store?' },
  cookies: riya,
})
const messagedBody = await json(messaged)
check('POST a message to the Forge Manager is 201', messaged.status === 201,
  String(messaged.status))
check('and it is addressed to the Forge Manager by role, not by a client-supplied id',
  messagedBody?.data?.recipient === 'Mihir Pawar', messagedBody?.data?.recipient)

const blankSubject = await call('/api/messages', {
  method: 'POST',
  body: { subject: '   ', message: 'x' },
  cookies: riya,
})
check('a blank subject is 422', blankSubject.status === 422, String(blankSubject.status))

const blankBody = await call('/api/messages', {
  method: 'POST',
  body: { subject: 'x', message: '' },
  cookies: riya,
})
check('a blank message is 422', blankBody.status === 422, String(blankBody.status))

check('an anonymous caller cannot message staff',
  (await call('/api/messages', { method: 'POST', body: { subject: 'x', message: 'y' } })).status
    === 401)

const badPayload = await call('/api/student/applications', {
  method: 'POST',
  body: { listingId: 'not-an-id' },
  cookies: riya,
})
check('a malformed listing id is 422', badPayload.status === 422, String(badPayload.status))

const missingListing = await call('/api/student/applications', {
  method: 'POST',
  body: { listingId: 999999 },
  cookies: riya,
})
check('applying to a listing that does not exist is 404', missingListing.status === 404,
  String(missingListing.status))

/* -------------------------------------------------------------------------- */
/* Role isolation                                                             */
/* -------------------------------------------------------------------------- */

const mihir = jar()
await call('/api/auth/login', {
  method: 'POST',
  body: { appId: 'ATL-2020-0001', password: PASSWORD },
  cookies: mihir,
})
const managerOnStudentApi = await call('/api/student/home', { cookies: mihir })
check(
  'the Forge Manager cannot read the student API',
  managerOnStudentApi.status === 403,
  String(managerOnStudentApi.status)
)

const managerOnStudentPage = await call('/student/home', { cookies: mihir })
const managerHtml = await text(managerOnStudentPage)
check(
  'the Forge Manager is redirected away from student pages',
  redirectsTo(managerOnStudentPage, managerHtml, '/select-role'),
  `${managerOnStudentPage.status} → ${managerOnStudentPage.headers.get('location') ?? 'in-payload'}`
)
check(
  'and never sees a student’s data on the way',
  !managerHtml.includes('Riya Kapoor')
)

const roleSwap = await call('/api/auth/role', {
  method: 'POST',
  body: { role: 'student' },
  cookies: mihir,
})
check(
  'a role the account does not hold cannot be assumed',
  roleSwap.status === 403,
  String(roleSwap.status)
)

/* -------------------------------------------------------------------------- */
/* Sign-out                                                                   */
/* -------------------------------------------------------------------------- */

await call('/api/auth/logout', { method: 'POST', cookies: riya })
check(
  'after logout the API is 401 again',
  (await call('/api/student/home', { cookies: riya })).status === 401
)

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

if (createdApplicationId) {
  await connection.execute('DELETE FROM application_events WHERE application_id = ?', [
    createdApplicationId,
  ])
  await connection.execute('DELETE FROM applications WHERE id = ?', [createdApplicationId])
  await connection.execute(
    "DELETE FROM activity_logs WHERE entity_type = 'application' AND entity_id = ?",
    [createdApplicationId]
  )
  await connection.execute(
    "DELETE FROM notifications WHERE entity_type = 'application' AND entity_id = ?",
    [createdApplicationId]
  )
}

// The wrong-password and unknown-account probes above are counted by the login
// rate limiter. The wrong-password one is cleared by the sign-in that follows
// it, but nobody ever signs in as the fictional account — without this, eight
// runs inside the limiter's window would lock it out and the probe would start
// answering 429 instead of the 401 the checks above assert.
await connection.execute(
  'DELETE FROM login_attempts WHERE identifier = ? AND succeeded = 0',
  ['atl-0000-0000']
)

// The probe message and the notification `sendMessage` writes for it.
await connection.execute(
  "DELETE FROM notifications WHERE entity_type = 'message' AND entity_id IN " +
    "(SELECT id FROM messages WHERE subject LIKE '__api_probe__%')"
)
await connection.execute("DELETE FROM messages WHERE subject LIKE '__api_probe__%'")

const [[counts]] = await connection.execute(`
  SELECT (SELECT COUNT(*) FROM applications)  AS applications,
         (SELECT COUNT(*) FROM messages)      AS messages,
         (SELECT COUNT(*) FROM notifications) AS notifications
`)
await connection.end()

check('teardown — seeded data restored',
  Number(counts.applications) === 6 && Number(counts.messages) === 2 &&
    Number(counts.notifications) === 6,
  `applications=${counts.applications} messages=${counts.messages} notifications=${counts.notifications}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
