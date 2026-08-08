/**
 * End-to-end verification of the Super Admin HTTP surface.
 *
 *   npm run test:admin:api          (expects a server on $BASE_URL)
 *
 * The reads are checked, but the point of this script is the sweep at the end:
 * every mutating endpoint in the application is called with a Super Admin
 * session and must refuse. A view-only role is only view-only if nothing
 * anywhere will take a write from it.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const ADMIN = 'ATL-2019-0004'
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

console.log(`\nATLAS Forge — Super Admin API verification (${BASE})\n`)

/* -------------------------------------------------------------------------- */
/* Anonymous                                                                  */
/* -------------------------------------------------------------------------- */

const anonPage = await call('/admin/overview')
check('anonymous admin page gets a real 307 to login',
  anonPage.status === 307 && (anonPage.headers.get('location') ?? '').includes('/login'),
  String(anonPage.status))
check('anonymous admin API is 401', (await call('/api/admin/overview')).status === 401)

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const meera = jar()
await call('/api/auth/login', { method: 'POST', body: { appId: ADMIN, password: PASSWORD }, cookies: meera })

const session = await json(await call('/api/auth/session', { cookies: meera }))
check('the session resolves the Super Admin', session?.data?.activeRole === 'super-admin',
  session?.data?.activeRole)

const overview = await json(await call('/api/admin/overview', { cookies: meera }))
check('GET /api/admin/overview', overview?.ok === true && overview.data.stats.length === 5)

for (const [path, key, expected] of [
  ['/api/admin/users', 'users', 15],
  ['/api/admin/startups', 'startups', 4],
  ['/api/admin/contacts', 'rows', 5],
  ['/api/admin/contracts', 'rows', 3],
  ['/api/admin/listings', 'rows', 7],
]) {
  const body = await json(await call(path, { cookies: meera }))
  check(`GET ${path}`, body?.data?.[key]?.length === expected,
    `${body?.data?.[key]?.length} of ${expected}`)
}

const report = await json(await call('/api/admin/activity-report', { cookies: meera }))
check('GET /api/admin/activity-report', report?.data?.events?.length === 6)

const profile = await json(await call('/api/admin/profile', { cookies: meera }))
check('GET /api/admin/profile', profile?.data?.profile?.appId === ADMIN)

/* -------------------------------------------------------------------------- */
/* Server-rendered pages                                                      */
/* -------------------------------------------------------------------------- */

for (const [path, needle] of [
  ['/admin/overview', 'Total Users'],
  ['/admin/summary', 'NovaMed'],
  ['/admin/users', 'ATL-2024-0871'],
  ['/admin/startups', 'Registered Startups'],
  ['/admin/incubation-status', 'Early Traction'],
  ['/admin/activity-report', 'Concierge Contacts'],
  ['/admin/contact-log', 'Mihir Pawar'],
  ['/admin/contract-log', 'Brand identity engagement'],
  ['/admin/job-listings', 'UI/UX Designer'],
  ['/admin/profile', 'Dr. Meera Joshi'],
]) {
  const response = await call(path, { cookies: meera })
  const html = await text(response)
  check(`page ${path} renders from MySQL`, response.status === 200 && html.includes(needle), needle)
}

const startupsPage = await text(await call('/admin/startups', { cookies: meera }))
check('the read-only escalation note closes the tables',
  startupsPage.includes('contact the Backend Manager or Forge Manager'))

const overviewPage = await text(await call('/admin/overview', { cookies: meera }))
check('the view-only banner is shown on every screen',
  overviewPage.includes('view-only mode'))

/* -------------------------------------------------------------------------- */
/* The sweep: every mutating endpoint in the application must refuse           */
/* -------------------------------------------------------------------------- */

const WRITES = [
  ['POST', '/api/student/applications', { listingId: 1 }],
  ['DELETE', '/api/student/applications/1', undefined],
  ['PATCH', '/api/student/profile', { name: 'x', email: 'x@y.z' }],
  ['PUT', '/api/student/availability', { isAvailable: true }],
  ['PUT', '/api/student/skills', { skillIds: [] }],
  ['POST', '/api/student/mentorship', { topic: 'x' }],
  ['POST', '/api/student/collabs', { title: 'x' }],
  ['POST', '/api/student/incubation', { ideaName: 'x' }],

  ['PATCH', '/api/founder/profile', { name: 'x', email: 'x@y.z' }],
  ['POST', '/api/founder/contacts', { studentId: 1 }],
  ['POST', '/api/founder/listings', { title: 'x' }],
  ['PUT', '/api/founder/startup', { name: 'x' }],
  ['POST', '/api/founder/mentorship', { topic: 'x' }],

  ['POST', '/api/forge/approvals', { listingId: 1, decision: 'approved' }],
  ['POST', '/api/forge/mentorship', { requestId: 1, mentorId: 1 }],
  ['POST', '/api/forge/incubation', { applicationId: 1 }],
  ['PATCH', '/api/forge/projects', { startupId: 1, featured: true }],

  ['POST', '/api/backend/job-queue', { listingId: 1, decision: 'approved' }],
  ['POST', '/api/backend/access', { userId: 1 }],
  ['DELETE', '/api/backend/access', { userId: 1 }],
  ['PATCH', '/api/backend/settings', { key: 'v1_mode', value: false }],
  ['PATCH', '/api/backend/profile', { name: 'x', email: 'x@y.z' }],
  ['POST', '/api/backend/reset', { confirm: 'RESET' }],
]

const allowed = []
for (const [method, path, body] of WRITES) {
  const response = await call(path, { method, body, cookies: meera })
  // 403 is the expected refusal; 404/405 also mean the verb is unreachable.
  if (![403, 404, 405].includes(response.status)) {
    allowed.push(`${method} ${path} → ${response.status}`)
  }
}
check(`every one of the ${WRITES.length} mutating endpoints refuses a Super Admin`,
  allowed.length === 0, allowed.join(', ') || 'all refused with 403')

// And the admin routes themselves take no verb but GET.
const adminVerbs = []
for (const path of [
  '/api/admin/overview',
  '/api/admin/users',
  '/api/admin/startups',
  '/api/admin/activity-report',
  '/api/admin/contacts',
  '/api/admin/contracts',
  '/api/admin/listings',
  '/api/admin/profile',
]) {
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const response = await call(path, { method, body: {}, cookies: meera })
    if (response.status !== 405) adminVerbs.push(`${method} ${path} → ${response.status}`)
  }
}
check('and the admin routes answer nothing but GET', adminVerbs.length === 0,
  adminVerbs.join(', ') || '32 attempts, all 405')

/* -------------------------------------------------------------------------- */
/* Nothing changed                                                            */
/* -------------------------------------------------------------------------- */

const mysql = (await import('mysql2/promise')).default
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})
const [[counts]] = await connection.execute(`
  SELECT (SELECT COUNT(*) FROM listings)              AS listings,
         (SELECT COUNT(*) FROM approvals)             AS approvals,
         (SELECT COUNT(*) FROM applications)          AS applications,
         (SELECT COUNT(*) FROM concierge_contacts)    AS contacts,
         (SELECT COUNT(*) FROM founder_access_grants) AS grants,
         (SELECT COUNT(*) FROM user_roles)            AS user_roles,
         (SELECT COUNT(*) FROM activity_logs)         AS activity,
         (SELECT setting_value FROM platform_settings WHERE setting_key = 'v1_mode') AS v1
`)
await connection.end()

check('the sweep left the platform exactly as it was',
  Number(counts.listings) === 7 && Number(counts.approvals) === 4 &&
    Number(counts.applications) === 6 && Number(counts.contacts) === 5 &&
    Number(counts.grants) === 2 && Number(counts.user_roles) === 12 &&
    Number(counts.activity) === 10 && counts.v1 === 'true',
  `listings=${counts.listings} approvals=${counts.approvals} applications=${counts.applications} ` +
    `contacts=${counts.contacts} grants=${counts.grants} roles=${counts.user_roles} ` +
    `activity=${counts.activity} v1_mode=${counts.v1}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
