/**
 * Verifies Phase 5 batch 2: request correlation, input validation and the
 * translation of database rejections into answers the caller can act on.
 *
 *   npm run test:errors          (expects a server on $BASE_URL)
 *
 * The central claim under test is that oversized or malformed input is refused
 * with a 422 that names the problem — on THIS server, which runs without
 * `STRICT_TRANS_TABLES` and would otherwise truncate silently, and equally on a
 * stock MySQL 8, which would otherwise answer 500.
 *
 * Nothing here is expected to write a row: every request is supposed to be
 * rejected. The teardown asserts exactly that.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
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

async function call(path, { method = 'GET', body, cookies, headers = {} } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    redirect: 'manual',
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(cookies ? { Cookie: cookies.header() } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (cookies) cookies.absorb(response)
  return response
}

const json = async (response) => response.json().catch(() => null)

const mysql = (await import('mysql2/promise')).default
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})
const one = async (sql, params = []) => (await db.query(sql, params))[0][0]

const before = await one(`
  SELECT (SELECT COUNT(*) FROM messages) AS messages,
         (SELECT COUNT(*) FROM listings) AS listings
`)

const student = jar()
await call('/api/auth/login', {
  method: 'POST',
  body: { appId: STUDENT, password: PASSWORD },
  cookies: student,
})

/* -------------------------------------------------------------------------- */
/* Request correlation                                                        */
/* -------------------------------------------------------------------------- */

const plain = await call('/api/notifications', { cookies: student })
const generatedId = plain.headers.get('x-request-id')
check('every API response carries a request id', Boolean(generatedId), generatedId)
check('and the id is a uuid, not a counter',
  /^[0-9a-f-]{36}$/i.test(generatedId ?? ''), generatedId)

const echoed = await call('/api/notifications', {
  cookies: student,
  headers: { 'x-request-id': 'upstream-trace-42' },
})
check('an id assigned upstream is kept rather than replaced',
  echoed.headers.get('x-request-id') === 'upstream-trace-42',
  echoed.headers.get('x-request-id'))

/* -------------------------------------------------------------------------- */
/* Field validation                                                           */
/* -------------------------------------------------------------------------- */

// `messages.subject` is VARCHAR(255).
const longSubject = await call('/api/messages', {
  method: 'POST',
  cookies: student,
  body: { subject: 'x'.repeat(300), message: 'Body is fine.' },
})
const longSubjectBody = await json(longSubject)
check('a subject past the column width is refused, not truncated',
  longSubject.status === 422, String(longSubject.status))
check('and the response names the field',
  longSubjectBody?.error?.details?.fields?.subject !== undefined,
  JSON.stringify(longSubjectBody?.error?.details))
check('and says what the limit is',
  /255/.test(longSubjectBody?.error?.details?.fields?.subject ?? ''),
  longSubjectBody?.error?.details?.fields?.subject)

const missingBoth = await call('/api/messages', {
  method: 'POST',
  cookies: student,
  body: {},
})
const missingBody = await json(missingBoth)
check('an empty submission reports every missing field at once',
  Object.keys(missingBody?.error?.details?.fields ?? {}).length === 2,
  JSON.stringify(missingBody?.error?.details?.fields))

const wrongType = await call('/api/messages', {
  method: 'POST',
  cookies: student,
  body: { subject: { nested: 'object' }, message: 'Body is fine.' },
})
const wrongTypeBody = await json(wrongType)
check('an object where text belongs is refused rather than stringified',
  wrongType.status === 422 &&
    /must be text/i.test(wrongTypeBody?.error?.details?.fields?.subject ?? ''),
  wrongTypeBody?.error?.details?.fields?.subject)

/* -------------------------------------------------------------------------- */
/* Body guards                                                                */
/* -------------------------------------------------------------------------- */

const hugeField = await call('/api/messages', {
  method: 'POST',
  cookies: student,
  body: { subject: 'Fine', message: 'y'.repeat(25_000) },
})
check('a single field larger than any column is refused', hugeField.status === 422,
  String(hugeField.status))

const hugeBody = await call('/api/messages', {
  method: 'POST',
  cookies: student,
  body: { subject: 'Fine', message: 'z'.repeat(200_000) },
})
const hugeBodyPayload = await json(hugeBody)
check('a body past the size limit is refused before it is parsed',
  hugeBody.status === 413, String(hugeBody.status))
check('and says so plainly',
  hugeBodyPayload?.error?.code === 'PAYLOAD_TOO_LARGE',
  hugeBodyPayload?.error?.code)

/* -------------------------------------------------------------------------- */
/* Database rejections become answers, not 500s                               */
/* -------------------------------------------------------------------------- */

// The collab route passes `title` straight to the listings service, so nothing
// in the application checks its length: this exercises the strict-mode setting
// on the pool and the translation of the driver's error.
const longTitle = await call('/api/student/collabs', {
  method: 'POST',
  cookies: student,
  body: {
    title: 'T'.repeat(300),
    summary: 'A summary.',
    collaborator: 'A designer',
    skills: 'Figma',
    engagement: '',
  },
})
const longTitleBody = await json(longTitle)
check('an unvalidated field too long for its column is a 422, not a 500',
  longTitle.status === 422, String(longTitle.status))
check('and the message names the column rather than leaking SQL',
  /title/i.test(longTitleBody?.error?.message ?? '') &&
    !/insert|select|values/i.test(longTitleBody?.error?.message ?? ''),
  longTitleBody?.error?.message)

/* -------------------------------------------------------------------------- */
/* Teardown                                                                   */
/* -------------------------------------------------------------------------- */

const after = await one(`
  SELECT (SELECT COUNT(*) FROM messages) AS messages,
         (SELECT COUNT(*) FROM listings) AS listings
`)
await db.execute('DELETE FROM login_attempts WHERE succeeded = 1')
await db.end()

check('every rejected request wrote nothing',
  Number(after.messages) === Number(before.messages) &&
    Number(after.listings) === Number(before.listings),
  `messages ${before.messages}->${after.messages}, listings ${before.listings}->${after.listings}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
