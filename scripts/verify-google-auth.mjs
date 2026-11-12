/**
 * Verification of the Google Sign-In HTTP surface.
 *
 *   npm run test:auth:google          (expects a server on $BASE_URL)
 *
 * Talks to a running server over HTTP exactly as a browser would; it imports
 * nothing from the application (the auth modules are `server-only` and cannot be
 * loaded outside Next anyway). It therefore covers everything reachable without
 * a live Google round-trip:
 *
 *   • config gating          — button/route on only when a client is configured
 *   • the /start contract     — redirect to Google with the right params + cookies
 *   • callback safety         — cancel, missing/stale state, and failure all land
 *                               on a safe /login?error=… with no token leakage
 *
 * The ID-token verification and account-eligibility branches (verified email →
 * existing active account; no-account / inactive / unverified) need a real
 * Google sign-in and are listed in the MANUAL CHECKLIST printed at the end.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const CALLBACK_PATH = '/api/auth/google/callback'

const pass = []
const fail = []
const skip = []
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)
const skipped = (name, why) => skip.push(`${name}${why ? ` — ${why}` : ''}`)

/** Minimal cookie jar, so a /start and its callback share one browser's cookies. */
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
  }
}

async function call(path, { cookies } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'GET',
    redirect: 'manual',
    headers: { ...(cookies ? { Cookie: cookies.header() } : {}) },
  })
  if (cookies) cookies.absorb(response)
  return response
}

const location = (response) => response.headers.get('location') ?? ''
const setCookieNames = (response) =>
  (response.headers.getSetCookie?.() ?? []).map((line) => line.split('=')[0].trim())
const rawSetCookie = (response) => (response.headers.getSetCookie?.() ?? []).join(' ; ')

console.log(`\nATLAS Forge — Google Sign-In verification (${BASE})\n`)

/* -------------------------------------------------------------------------- */
/* Is Google configured on this server?                                       */
/* -------------------------------------------------------------------------- */

const probeJar = jar()
const start = await call('/api/auth/google/start', { cookies: probeJar })
const startLocation = location(start)
const enabled = /accounts\.google\.com/.test(startLocation)

check(
  'start: redirects (3xx) rather than rendering',
  start.status >= 300 && start.status < 400,
  String(start.status)
)

if (!enabled) {
  // No client configured in this server's env — assert the "off" behaviour.
  check(
    'disabled: start redirects to /login?error=google_unavailable',
    startLocation.includes('/login') && startLocation.includes('error=google_unavailable'),
    startLocation
  )
  check(
    'disabled: login page hides the Google button',
    !(await (await call('/login')).text()).includes('Continue with Google')
  )
  skipped(
    'enabled-path checks (start→Google params, cookies)',
    'GOOGLE_CLIENT_ID/SECRET not set on this server'
  )
} else {
  // A client is configured — assert the full /start → Google contract.
  const url = new URL(startLocation)
  const q = url.searchParams

  check('enabled: start → accounts.google.com', url.hostname === 'accounts.google.com', url.hostname)
  check('enabled: response_type=code (Authorization Code flow)', q.get('response_type') === 'code')
  check(
    'enabled: scope requests openid + email + profile',
    ['openid', 'email', 'profile'].every((s) => (q.get('scope') ?? '').includes(s)),
    q.get('scope') ?? ''
  )
  check('enabled: a client_id is present', Boolean(q.get('client_id')))
  check(
    'enabled: redirect_uri is this app’s callback',
    (q.get('redirect_uri') ?? '').endsWith(CALLBACK_PATH),
    q.get('redirect_uri') ?? ''
  )
  check('enabled: a state is present (CSRF)', Boolean(q.get('state')))
  check('enabled: a nonce is present (replay)', Boolean(q.get('nonce')))
  check(
    'enabled: client_secret never travels in the auth URL',
    !startLocation.toLowerCase().includes('client_secret')
  )

  const names = setCookieNames(start)
  check(
    'enabled: start sets g_oauth_state + g_oauth_nonce cookies',
    names.includes('g_oauth_state') && names.includes('g_oauth_nonce'),
    names.join(',')
  )
  check(
    'enabled: oauth cookies are HttpOnly',
    /g_oauth_state=[^;]*;[^]*httponly/i.test(rawSetCookie(start)) ||
      rawSetCookie(start).toLowerCase().includes('httponly'),
    'HttpOnly flag present'
  )

  // A valid-looking state with a bogus code: the server contacts Google, the
  // exchange fails, and we must still land on a safe /login?error=… .
  const state = q.get('state')
  const failed = await call(
    `${CALLBACK_PATH}?code=definitely-not-a-real-code&state=${encodeURIComponent(state)}`,
    { cookies: probeJar }
  )
  check(
    'enabled: callback with a bad code → safe /login?error=',
    location(failed).includes('/login') && location(failed).includes('error='),
    location(failed)
  )

  check(
    'enabled: login page shows the Google button',
    (await (await call('/login')).text()).includes('Continue with Google')
  )
}

/* -------------------------------------------------------------------------- */
/* Callback safety — holds whether or not Google is configured                */
/* -------------------------------------------------------------------------- */

// User cancelled at Google (error=access_denied).
const cancelled = await call(`${CALLBACK_PATH}?error=access_denied`)
check(
  'callback: cancellation → /login?error=google_cancelled',
  location(cancelled).includes('/login') && location(cancelled).includes('error=google_cancelled'),
  location(cancelled)
)

// A code + state but NO matching state cookie (forged / stale) → CSRF guard.
const noStateCookie = await call(`${CALLBACK_PATH}?code=abc&state=mismatch`)
check(
  'callback: missing/stale state cookie → /login?error=google_state',
  location(noStateCookie).includes('/login') && location(noStateCookie).includes('error=google_state'),
  location(noStateCookie)
)

// A state cookie that does not match the query state → still rejected as CSRF.
const mismatchJar = jar()
const seeded = await call('/api/auth/google/start', { cookies: mismatchJar })
if (mismatchJar.raw().some(([n]) => n === 'g_oauth_state')) {
  const mismatch = await call(`${CALLBACK_PATH}?code=abc&state=not-the-cookie-value`, {
    cookies: mismatchJar,
  })
  check(
    'callback: state query ≠ state cookie → /login?error=google_state',
    location(mismatch).includes('error=google_state'),
    location(mismatch)
  )
} else {
  void seeded
  skipped('callback: state-mismatch check', 'no state cookie issued (Google disabled)')
}

check(
  'callback: error redirect never leaks a code or token in its target',
  !/id_token|access_token|client_secret/i.test(location(cancelled) + location(noStateCookie))
)

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

console.log(`${pass.length} passed, ${fail.length} failed${skip.length ? `, ${skip.length} skipped` : ''}\n`)
for (const line of pass) console.log(`  ✓ ${line}`)
for (const line of skip) console.log(`  – ${line}`)
for (const line of fail) console.log(`  ✗ ${line}`)

console.log(`\nManual checklist (needs a configured client + a real Google account):`)
console.log(`  1. Click "Continue with Google" → consent → signed in → role home (or /change-password if flagged).`)
console.log(`  2. A Google account whose email has NO ATLAS Forge account → /login?error=google_no_account.`)
console.log(`  3. An account that is suspended/inactive → /login?error=google_inactive.`)
console.log(`  4. Cancel at Google → /login?error=google_cancelled.`)

process.exit(fail.length === 0 ? 0 : 1)
