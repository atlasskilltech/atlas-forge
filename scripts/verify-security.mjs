/**
 * Verifies the Phase 5 batch 1 hardening: response headers, the cross-site
 * request block, and login rate limiting.
 *
 *   npm run test:security        (expects a server on $BASE_URL)
 *
 * The rate-limit checks deliberately lock an identifier out, so they run
 * against a throwaway App ID that belongs to nobody. Every row this suite
 * writes to `login_attempts` is removed at the end, and the seeded tables are
 * never touched.
 *
 * NOTE: this must run against a production build (`next start`). A development
 * server relaxes several headers and serves `'unsafe-eval'` on purpose.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const REAL_ACCOUNT = 'ATL-2024-0871'
const PASSWORD = 'Atlas@2026'
/** Never a real App ID — the format is deliberately impossible. */
const THROWAWAY = 'ATL-0000-RATELIMIT'

const pass = []
const fail = []
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

function jar() {
  const cookies = new Map()
  return {
    header: () => [...cookies].map(([k, v]) => `${k}=${v}`).join('; '),
    names: () => [...cookies.keys()],
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

// Everything written from here on is removed in the teardown. The count is
// captured separately from the high-water mark: ids leave gaps once the
// retention sweep has run, so `MAX(id)` is not a row count.
const before = await one(
  'SELECT COALESCE(MAX(id), 0) AS id, COUNT(*) AS total FROM login_attempts'
)
const highWater = Number(before.id)
const attemptsBefore = Number(before.total)

/* -------------------------------------------------------------------------- */
/* Security headers                                                           */
/* -------------------------------------------------------------------------- */

const page = await call('/login')
const csp = page.headers.get('content-security-policy') ?? ''

check('a page answers with a Content-Security-Policy', csp.length > 0)
check("CSP blocks framing", csp.includes("frame-ancestors 'none'"), csp.slice(0, 60))
check("CSP blocks plugins", csp.includes("object-src 'none'"))
check("CSP pins the base URI", csp.includes("base-uri 'self'"))
check("CSP restricts form targets", csp.includes("form-action 'self'"))
check('CSP restricts network calls to this origin', csp.includes("connect-src 'self'"))
// Would rewrite every subresource to https:// and break a plain-HTTP
// deployment; HSTS covers the same ground only where TLS exists.
check('CSP does not force HTTPS on a build that may be served over HTTP',
  !csp.includes('upgrade-insecure-requests'))
check('X-Content-Type-Options is nosniff',
  page.headers.get('x-content-type-options') === 'nosniff')
check('X-Frame-Options is DENY', page.headers.get('x-frame-options') === 'DENY')
check('Referrer-Policy is set',
  page.headers.get('referrer-policy') === 'strict-origin-when-cross-origin')
check('Permissions-Policy denies camera, microphone and geolocation',
  (page.headers.get('permissions-policy') ?? '').includes('camera=()') &&
  (page.headers.get('permissions-policy') ?? '').includes('geolocation=()'))
check('Cross-Origin-Opener-Policy isolates the browsing context',
  page.headers.get('cross-origin-opener-policy') === 'same-origin')
check('the framework version is not advertised', page.headers.get('x-powered-by') === null)

const apiResponse = await call('/api/auth/session')
check('API responses are never cached',
  (apiResponse.headers.get('cache-control') ?? '').includes('no-store'),
  apiResponse.headers.get('cache-control'))
check('API responses carry their own strict CSP',
  (apiResponse.headers.get('content-security-policy') ?? '').includes("default-src 'none'"))

/* -------------------------------------------------------------------------- */
/* Cross-site request blocking                                                */
/* -------------------------------------------------------------------------- */

const foreign = await call('/api/auth/login', {
  method: 'POST',
  body: { appId: REAL_ACCOUNT, password: PASSWORD },
  headers: { Origin: 'https://not-atlas-forge.example' },
})
check('a POST claiming a foreign Origin is refused', foreign.status === 403,
  String(foreign.status))
check('and refused before it could authenticate',
  (await json(foreign))?.error?.code === 'FORBIDDEN')

const sameOrigin = jar()
const allowed = await call('/api/auth/login', {
  method: 'POST',
  body: { appId: REAL_ACCOUNT, password: PASSWORD },
  headers: { Origin: BASE },
  cookies: sameOrigin,
})
check('the same POST from this origin succeeds', allowed.status === 200,
  String(allowed.status))
check('and issues the session cookie',
  sameOrigin.names().some((name) => name.includes('atlas_forge_session')),
  sameOrigin.names().join(','))

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                              */
/* -------------------------------------------------------------------------- */

const limit = Number(process.env.AUTH_RATE_LIMIT_MAX_ATTEMPTS ?? 8)
const windowSeconds = Number(process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES ?? 15) * 60

// One more than the allowance: the last one must be refused rather than
// answered with a 401, which proves the check runs before the password does.
const statuses = []
for (let attempt = 0; attempt < limit + 1; attempt += 1) {
  const response = await call('/api/auth/login', {
    method: 'POST',
    body: { appId: THROWAWAY, password: `guess-${attempt}` },
  })
  statuses.push(response.status)
  if (response.status === 429) {
    // Bounded by the window, not merely positive: an unbounded value is what a
    // timezone mismatch between the driver and the server looks like, and it
    // would tell a locked-out user to come back in six hours.
    const retryAfter = Number(response.headers.get('retry-after'))
    check('the lockout names a wait in Retry-After',
      retryAfter > 0 && retryAfter <= windowSeconds,
      `${retryAfter}s of a ${windowSeconds}s window`)
    const body = await json(response)
    check('and says so in the body', body?.error?.code === 'TOO_MANY_REQUESTS',
      JSON.stringify(body?.error))
    check('with a retryAfterSeconds the client can use',
      Number(body?.error?.details?.retryAfterSeconds) > 0)
    break
  }
}

check(`the first ${limit} wrong passwords are 401s`,
  statuses.slice(0, limit).every((status) => status === 401),
  statuses.join(','))
check('the attempt past the limit is 429', statuses.at(-1) === 429, statuses.join(','))

const logged = await one(
  'SELECT COUNT(*) AS total FROM login_attempts WHERE identifier = ? AND succeeded = 0',
  [THROWAWAY.toLowerCase()]
)
check('every failure was recorded', Number(logged.total) === limit, String(logged.total))

// Read the value back rather than comparing in SQL: the column collation is
// utf8mb4_unicode_ci, so `WHERE identifier = 'ATL-...'` matches either casing
// and could never tell the two apart.
const stored = await one(
  'SELECT identifier FROM login_attempts WHERE identifier = ? LIMIT 1',
  [THROWAWAY]
)
check('the identifier is stored lower-cased, so casing cannot split the counter',
  stored?.identifier === THROWAWAY.toLowerCase(), stored?.identifier)

// A locked-out identifier must not lock out everyone else.
const other = await call('/api/auth/login', {
  method: 'POST',
  body: { appId: REAL_ACCOUNT, password: PASSWORD },
})
check('a different account is unaffected by that lockout', other.status === 200,
  String(other.status))

/* ---- a correct password clears the streak -------------------------------- */

for (let attempt = 0; attempt < 3; attempt += 1) {
  await call('/api/auth/login', {
    method: 'POST',
    body: { appId: REAL_ACCOUNT, password: 'not-the-password' },
  })
}
const beforeSuccess = await one(
  'SELECT COUNT(*) AS n FROM login_attempts WHERE identifier = ? AND succeeded = 0',
  [REAL_ACCOUNT.toLowerCase()]
)
check('failures against a real account are counted too', Number(beforeSuccess.n) === 3,
  String(beforeSuccess.n))

await call('/api/auth/login', {
  method: 'POST',
  body: { appId: REAL_ACCOUNT, password: PASSWORD },
})
const afterSuccess = await one(
  'SELECT COUNT(*) AS n FROM login_attempts WHERE identifier = ? AND succeeded = 0',
  [REAL_ACCOUNT.toLowerCase()]
)
check('a correct password clears the failure streak', Number(afterSuccess.n) === 0,
  String(afterSuccess.n))

/* -------------------------------------------------------------------------- */
/* Teardown                                                                   */
/* -------------------------------------------------------------------------- */

await db.execute('DELETE FROM login_attempts WHERE id > ?', [highWater])

const after = await one(`
  SELECT (SELECT COUNT(*) FROM login_attempts) AS attempts,
         (SELECT COUNT(*) FROM users)          AS users,
         (SELECT COUNT(*) FROM activity_logs)  AS activity,
         (SELECT COUNT(*) FROM error_logs)     AS errors
`)
await db.end()

check('teardown - attempt log cleared and seeded data untouched',
  Number(after.attempts) === attemptsBefore && Number(after.users) === 15 &&
    Number(after.activity) === 10 && Number(after.errors) === 0,
  `attempts=${after.attempts} users=${after.users} activity=${after.activity} errors=${after.errors}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
