/**
 * Verifies Phase 5 batch 3: opt-in pagination and the ceilings on lists that
 * are read whole.
 *
 *   npm run test:pagination      (expects a server on $BASE_URL)
 *
 * The property that matters most is the one that is easiest to break: a request
 * WITHOUT page parameters must be answered exactly as it was before this batch,
 * because every screen in the app makes that request and none of them knows
 * what a page is.
 *
 * Extra rows are created and removed inside the run, so the seeded counts are
 * unchanged at the end.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const MANAGER = 'ATL-2020-0001'
const BACKEND_MANAGER = 'ATL-2022-0012'
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

async function call(path, { method = 'GET', body, cookies } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    redirect: 'manual',
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

async function signIn(appId) {
  const cookies = jar()
  await call('/api/auth/login', { method: 'POST', body: { appId, password: PASSWORD }, cookies })
  return cookies
}

const mysql = (await import('mysql2/promise')).default
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})
const one = async (sql, params = []) => (await db.query(sql, params))[0][0]

const activityHighWater = Number(
  (await one('SELECT COALESCE(MAX(id), 0) AS id FROM activity_logs')).id
)
const seededActivity = Number((await one('SELECT COUNT(*) AS n FROM activity_logs')).n)

// Enough rows that a page boundary is a real boundary, not an edge case.
for (let index = 0; index < 25; index += 1) {
  await db.execute(
    "INSERT INTO activity_logs (actor_user_id, action, module, status) VALUES (1, ?, 'Platform', 'logged')",
    [`__pagination_probe__ ${index}`]
  )
}
const totalActivity = seededActivity + 25

const backend = await signIn(BACKEND_MANAGER)
const forge = await signIn(MANAGER)
const student = await signIn(STUDENT)

/* -------------------------------------------------------------------------- */
/* The unpaged request is unchanged                                           */
/* -------------------------------------------------------------------------- */

const plain = await call('/api/backend/logs', { cookies: backend })
const plainBody = await json(plain)
check('a request with no page parameters still answers 200', plain.status === 200)
check('and returns the array shape the screen already renders',
  Array.isArray(plainBody?.data?.rows), typeof plainBody?.data?.rows)
check('and still returns the established default of 100 newest entries',
  plainBody.data.rows.length === Math.min(100, totalActivity),
  `${plainBody.data.rows.length} of ${totalActivity}`)
check('no page headers are invented for a request that asked for none',
  plain.headers.get('x-per-page') === null, plain.headers.get('x-per-page'))

/* -------------------------------------------------------------------------- */
/* Opt-in paging                                                              */
/* -------------------------------------------------------------------------- */

const first = await call('/api/backend/logs?page=1&perPage=10', { cookies: backend })
const firstBody = await json(first)
check('asking for a page returns exactly that many rows',
  firstBody?.data?.rows?.length === 10, String(firstBody?.data?.rows?.length))
check('the total is reported in x-total-count',
  Number(first.headers.get('x-total-count')) === totalActivity,
  `${first.headers.get('x-total-count')} vs ${totalActivity}`)
check('the page and size are echoed back',
  first.headers.get('x-page') === '1' && first.headers.get('x-per-page') === '10',
  `${first.headers.get('x-page')}/${first.headers.get('x-per-page')}`)
check('and the page count is derived from them',
  Number(first.headers.get('x-total-pages')) === Math.ceil(totalActivity / 10),
  first.headers.get('x-total-pages'))

const second = await call('/api/backend/logs?page=2&perPage=10', { cookies: backend })
const secondBody = await json(second)
check('the second page holds different rows',
  secondBody.data.rows[0].id !== firstBody.data.rows[0].id,
  `${firstBody.data.rows[0].id} vs ${secondBody.data.rows[0].id}`)

const firstIds = new Set(firstBody.data.rows.map((row) => row.id))
check('and no row appears on both pages',
  secondBody.data.rows.every((row) => !firstIds.has(row.id)))

const far = await call('/api/backend/logs?page=999&perPage=10', { cookies: backend })
const farBody = await json(far)
check('a page past the end is empty rather than an error',
  far.status === 200 && farBody.data.rows.length === 0, String(far.status))

/* -------------------------------------------------------------------------- */
/* Bad page parameters are refused, not silently corrected                    */
/* -------------------------------------------------------------------------- */

for (const [query, label] of [
  ['?page=0', 'page=0'],
  ['?page=-3', 'a negative page'],
  ['?perPage=abc', 'a non-numeric size'],
  ['?page=1.5', 'a fractional page'],
]) {
  const response = await call(`/api/backend/logs${query}`, { cookies: backend })
  check(`${label} is rejected with 422`, response.status === 422, String(response.status))
}

const huge = await call('/api/backend/logs?page=1&perPage=100000', { cookies: backend })
check('an absurd page size is clamped rather than honoured',
  Number(huge.headers.get('x-per-page')) === 200, huge.headers.get('x-per-page'))

/* -------------------------------------------------------------------------- */
/* The same contract on the other paged endpoints                             */
/* -------------------------------------------------------------------------- */

for (const [path, cookies, shape] of [
  ['/api/forge/logs', forge, 'logs'],
  ['/api/backend/errors', backend, 'rows'],
  ['/api/notifications', student, 'notifications'],
  ['/api/messages', student, 'received'],
]) {
  const response = await call(`${path}?page=1&perPage=5`, { cookies })
  const body = await json(response)
  check(`${path} accepts a page`, response.status === 200, String(response.status))
  check(`${path} keeps its body shape`, Array.isArray(body?.data?.[shape]),
    typeof body?.data?.[shape])
  check(`${path} reports a total`, response.headers.get('x-total-count') !== null)
  check(`${path} returns no more than the page size`,
    (body?.data?.[shape]?.length ?? 0) <= 5, String(body?.data?.[shape]?.length))
}

/* -------------------------------------------------------------------------- */
/* Teardown                                                                   */
/* -------------------------------------------------------------------------- */

await db.execute('DELETE FROM activity_logs WHERE id > ?', [activityHighWater])
await db.execute('DELETE FROM login_attempts WHERE succeeded = 1')

const after = await one(`
  SELECT (SELECT COUNT(*) FROM activity_logs) AS activity,
         (SELECT COUNT(*) FROM users)         AS users,
         (SELECT COUNT(*) FROM messages)      AS messages
`)
await db.end()

check('teardown - probe rows removed and seeded data intact',
  Number(after.activity) === seededActivity && Number(after.users) === 15 &&
    Number(after.messages) === 2,
  `activity=${after.activity} users=${after.users} messages=${after.messages}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
