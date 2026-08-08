/**
 * End-to-end verification of the Backend Manager HTTP surface.
 *
 *   npm run test:backend:api          (expects a server on $BASE_URL)
 *
 * The override is the point of this role, so it is checked from both sides:
 * the Forge Manager's decision must survive it, and the effect must reach the
 * student browsing listings.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const MANAGER = 'ATL-2022-0012' // Shantanu — founder + backend-manager
const FORGE = 'ATL-2020-0001'
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

console.log(`\nATLAS Forge — Backend Manager API verification (${BASE})\n`)

/* -------------------------------------------------------------------------- */
/* Anonymous                                                                  */
/* -------------------------------------------------------------------------- */

const anonPage = await call('/backend/dashboard')
check('anonymous backend page gets a real 307 to login',
  anonPage.status === 307 && (anonPage.headers.get('location') ?? '').includes('/login'),
  String(anonPage.status))
check('anonymous backend API is 401', (await call('/api/backend/dashboard')).status === 401)

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

const shantanu = await signIn(MANAGER)

const dashboard = await json(await call('/api/backend/dashboard', { cookies: shantanu }))
check('GET /api/backend/dashboard', dashboard?.ok === true && dashboard.data.stats.length === 5)
check('the error counter reads the real table',
  dashboard.data.stats[4].value === '0' && dashboard.data.stats[4].tone === 'neutral')

for (const [path, key, expected] of [
  ['/api/backend/users', 'users', 15],
  ['/api/backend/logs', 'rows', 10],
  ['/api/backend/errors', 'rows', 0],
  ['/api/backend/contacts', 'rows', 5],
  ['/api/backend/contracts', 'rows', 3],
  ['/api/backend/listings', 'rows', 7],
]) {
  const body = await json(await call(path, { cookies: shantanu }))
  check(`GET ${path}`, body?.data?.[key]?.length === expected,
    `${body?.data?.[key]?.length} of ${expected}`)
}

const queue = await json(await call('/api/backend/job-queue', { cookies: shantanu }))
check('GET /api/backend/job-queue shows every listing', queue?.data?.rows?.length === 7)
check('and carries the Forge Manager verdict per row',
  queue.data.rows.filter((row) => row.decision !== 'Pending').length === 4)

const settings = await json(await call('/api/backend/settings', { cookies: shantanu }))
check('GET /api/backend/settings', settings?.data?.groups?.length === 3)

const access = await json(await call('/api/backend/access', { cookies: shantanu }))
check('GET /api/backend/access without a search returns no match',
  access?.data?.matched === null && access.data.grants.length === 2)

const searched = await json(
  await call('/api/backend/access?q=ATL-2024-0871', { cookies: shantanu })
)
check('GET /api/backend/access?q= searches on the server',
  searched?.data?.matched?.name === 'Riya Kapoor', searched?.data?.matched?.name)

/* -------------------------------------------------------------------------- */
/* Server-rendered pages                                                      */
/* -------------------------------------------------------------------------- */

for (const [path, needle] of [
  ['/backend/dashboard', 'Total Users'],
  ['/backend/users', 'ATL-2024-0871'],
  ['/backend/job-queue', 'FM Decision'],
  ['/backend/settings', 'Platform Name'],
  ['/backend/logs', 'Granted Founder access'],
  ['/backend/activity-log', 'Granted Founder access'],
  ['/backend/error-logs', 'Error Logs'],
  ['/backend/contact-log', 'Mihir Pawar'],
  ['/backend/contract-log', 'Brand identity engagement'],
  ['/backend/listings', 'UI/UX Designer'],
  ['/backend/role-assignments', 'Current Founders With Access'],
  ['/backend/grant-access', 'Grant Founder Access'],
  ['/backend/revoke-access', 'Revoke'],
  ['/backend/profile', 'Shantanu Ghuriani'],
]) {
  const response = await call(path, { cookies: shantanu })
  const html = await text(response)
  check(`page ${path} renders from MySQL`, response.status === 200 && html.includes(needle), needle)
}

const searchPage = await call('/backend/role-assignments?q=ATL-2021-0119', { cookies: shantanu })
const searchHtml = await text(searchPage)
check('the Role Management search runs from the URL',
  searchHtml.includes('Priya Shah') && searchHtml.includes('Current role:'))

/* -------------------------------------------------------------------------- */
/* Overriding a Forge Manager decision                                        */
/* -------------------------------------------------------------------------- */

const rejected = queue.data.rows.find((row) => row.decision === 'Rejected')
const riya = await signIn(STUDENT)
const jobsBefore = await json(await call('/api/student/jobs', { cookies: riya }))

const overrode = await call('/api/backend/job-queue', {
  method: 'POST',
  body: { listingId: rejected.listingId, decision: 'approved' },
  cookies: shantanu,
})
check('POST an override is 200', overrode.status === 200, String(overrode.status))

const afterOverride = await json(await call('/api/backend/job-queue', { cookies: shantanu }))
const row = afterOverride.data.rows.find((item) => item.listingId === rejected.listingId)
check('the Forge Manager verdict is still shown', row.decision === 'Rejected', row.decision)
check('and this role’s own verdict sits beside it', row.override === 'approved',
  String(row.override))

const jobsAfter = await json(await call('/api/student/jobs', { cookies: riya }))
check('the override reaches the student browse screen',
  jobsAfter.data.jobs.length === jobsBefore.data.jobs.length + 1,
  `${jobsBefore.data.jobs.length} → ${jobsAfter.data.jobs.length}`)

const forgeQueue = await json(
  await call('/api/forge/approvals', { cookies: await signIn(FORGE) })
)
const forgeRow = forgeQueue.data.items.find((item) => item.listingId === rejected.listingId)
check('the Forge Manager still sees their own decision unchanged',
  forgeRow.decision === 'rejected', forgeRow.decision)
check('and can see it was overridden', forgeRow.overriddenBy === 'approved',
  String(forgeRow.overriddenBy))

/* -------------------------------------------------------------------------- */
/* Access                                                                     */
/* -------------------------------------------------------------------------- */

const target = searched.data.matched
check('the target has no founder access yet', target.hasAccess === false)
check('and cannot reach the founder API',
  (await call('/api/founder/home', { cookies: riya })).status === 403)

const granted = await call('/api/backend/access', {
  method: 'POST',
  body: { userId: target.userId },
  cookies: shantanu,
})
check('POST a grant is 200', granted.status === 200, String(granted.status))
check('the existing session gains access without signing in again',
  (await call('/api/founder/home', { cookies: riya })).status === 200)

const grantAgain = await call('/api/backend/access', {
  method: 'POST',
  body: { userId: target.userId },
  cookies: shantanu,
})
check('granting twice is 409', grantAgain.status === 409, String(grantAgain.status))

const revoked = await call('/api/backend/access', {
  method: 'DELETE',
  body: { userId: target.userId },
  cookies: shantanu,
})
check('DELETE a grant is 200', revoked.status === 200, String(revoked.status))
check('and access is closed on the next request',
  (await call('/api/founder/home', { cookies: riya })).status === 403)

const revokeAgain = await call('/api/backend/access', {
  method: 'DELETE',
  body: { userId: target.userId },
  cookies: shantanu,
})
check('revoking again is 404, not a silent success', revokeAgain.status === 404,
  String(revokeAgain.status))

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

const toggled = await call('/api/backend/settings', {
  method: 'PATCH',
  body: { key: 'job_listings_require_approval', value: false },
  cookies: shantanu,
})
check('PATCH a setting is 200', toggled.status === 200, String(toggled.status))

const afterToggle = await json(await call('/api/backend/settings', { cookies: shantanu }))
const moderation = afterToggle.data.groups.find((group) => group.key === 'moderation')
check('the setting reads back as changed',
  moderation.items.find((item) => item.id === 'job_listings_require_approval')?.on === false)

// A founder posting a job while approval is off should get a live listing —
// this setting is a real feature check, not a label.
const founderJar = await signIn(MANAGER)
const posted = await call('/api/founder/listings', {
  method: 'POST',
  body: { title: '__api_probe__ No Approval Needed', description: 'x' },
  cookies: founderJar,
})
const postedBody = await json(posted)
const hiring = await json(await call('/api/founder/hiring', { cookies: founderJar }))
const probe = hiring.data.listingsByTab['My Listings'].find((item) =>
  item.title.startsWith('__api_probe__')
)
check('a setting change takes effect immediately in the services',
  probe?.status === 'Live', probe?.status)

await call('/api/backend/settings', {
  method: 'PATCH',
  body: { key: 'job_listings_require_approval', value: true },
  cookies: shantanu,
})

const blankName = await call('/api/backend/settings', {
  method: 'PATCH',
  body: { key: 'platform_name', value: '   ' },
  cookies: shantanu,
})
check('a string setting cannot be blanked', blankName.status === 422, String(blankName.status))

const unknownSetting = await call('/api/backend/settings', {
  method: 'PATCH',
  body: { key: 'not_a_setting', value: 'x' },
  cookies: shantanu,
})
check('an unknown setting key is 404', unknownSetting.status === 404,
  String(unknownSetting.status))

/* -------------------------------------------------------------------------- */
/* The Danger Zone refuses without its confirmation                           */
/* -------------------------------------------------------------------------- */

const noConfirm = await call('/api/backend/reset', {
  method: 'POST',
  body: {},
  cookies: shantanu,
})
check('the reset refuses without the confirmation phrase', noConfirm.status === 422,
  String(noConfirm.status))

const wrongConfirm = await call('/api/backend/reset', {
  method: 'POST',
  body: { confirm: 'yes' },
  cookies: shantanu,
})
check('and refuses the wrong phrase', wrongConfirm.status === 422, String(wrongConfirm.status))

const forgeOnReset = await call('/api/backend/reset', {
  method: 'POST',
  body: { confirm: 'RESET' },
  cookies: await signIn(FORGE),
})
check('and is closed to the Forge Manager entirely', forgeOnReset.status === 403,
  String(forgeOnReset.status))

const listingsIntact = await json(await call('/api/backend/listings', { cookies: shantanu }))
check('nothing was cleared by the refused attempts', listingsIntact.data.rows.length === 8,
  `${listingsIntact.data.rows.length} listings incl. the probe`)

/* -------------------------------------------------------------------------- */
/* Role isolation                                                             */
/* -------------------------------------------------------------------------- */

check('a student cannot read the backend API',
  (await call('/api/backend/dashboard', { cookies: riya })).status === 403)
check('the Forge Manager cannot read the backend API',
  (await call('/api/backend/dashboard', { cookies: await signIn(FORGE) })).status === 403)
check('the Forge Manager cannot change platform settings',
  (await call('/api/backend/settings', {
    method: 'PATCH',
    body: { key: 'v1_mode', value: false },
    cookies: await signIn(FORGE),
  })).status === 403)

const studentOnBackendPage = await call('/backend/dashboard', { cookies: riya })
const studentHtml = await text(studentOnBackendPage)
check('a student is redirected away from backend pages',
  redirectsTo(studentOnBackendPage, studentHtml, '/select-role'))
check('and never sees the platform counters', !studentHtml.includes('Total Users'))

/* -------------------------------------------------------------------------- */
/* Teardown                                                                   */
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

if (postedBody?.data?.listingId) {
  await run('DELETE FROM listing_skills WHERE listing_id = ?', [postedBody.data.listingId])
  await run('DELETE FROM listings WHERE id = ?', [postedBody.data.listingId])
}
await run(
  `DELETE a FROM approvals a JOIN roles r ON r.id = a.decided_as_role_id
    WHERE a.listing_id = ? AND r.slug = 'backend-manager'`,
  [rejected.listingId]
)
await run("UPDATE listings SET status = 'rejected' WHERE id = ?", [rejected.listingId])
await run("DELETE FROM notifications WHERE entity_type = 'listing' AND entity_id = ?", [
  rejected.listingId,
])
await run('DELETE FROM founder_access_grants WHERE user_id = ?', [target.userId])
await run(
  "DELETE ur FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ? AND r.slug = 'founder'",
  [target.userId]
)
await run("DELETE FROM notifications WHERE type = 'access' AND user_id = ?", [target.userId])
await run("UPDATE platform_settings SET setting_value = 'true' WHERE setting_key = ?", [
  'job_listings_require_approval',
])
await run(
  'DELETE FROM activity_logs WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)'
)

const [[counts]] = await connection.execute(`
  SELECT (SELECT COUNT(*) FROM listings)                       AS listings,
         (SELECT COUNT(*) FROM approvals)                      AS approvals,
         (SELECT COUNT(*) FROM founder_access_grants)          AS grants,
         (SELECT COUNT(*) FROM activity_logs)                  AS activity,
         (SELECT COUNT(*) FROM users)                          AS users
`)
await connection.end()

check('teardown — seeded data restored',
  Number(counts.listings) === 7 && Number(counts.approvals) === 4 &&
    Number(counts.grants) === 2 && Number(counts.activity) === 10 &&
    Number(counts.users) === 15,
  `listings=${counts.listings} approvals=${counts.approvals} grants=${counts.grants} activity=${counts.activity}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
