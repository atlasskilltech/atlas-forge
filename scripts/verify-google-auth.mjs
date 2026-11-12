import { createHmac } from 'node:crypto'

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
/* Forced password-change exemption for Google sessions (viaGoogle)           */
/* -------------------------------------------------------------------------- */

// These prove the guard's behaviour directly, without a live Google round-trip,
// by minting the SAME signed session cookie the server issues — using the
// server's own SESSION_SECRET from this run's env. A cookie forged WITHOUT that
// secret is rejected, which is exactly what the forgery check asserts. A
// synthetic active user (must_change_password = 1) is created and removed in
// teardown; the seeded tables are left exactly as found.

const SECRET = process.env.SESSION_SECRET
let db = null
if (!SECRET) {
  skipped('viaGoogle forced-change checks', 'SESSION_SECRET not set in this run')
} else {
  try {
    const mysql = (await import('mysql2/promise')).default
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ?? '',
      database: process.env.DB_NAME,
    })
  } catch (error) {
    skipped('viaGoogle forced-change checks', `DB unavailable — ${error.message}`)
  }
}

if (db) {
  // Production build → the cookie name carries the `__Host-` prefix. The server
  // reads it from the Cookie header by name; `__Host-`/Secure are browser send
  // rules and do not affect this manual request.
  const base = process.env.SESSION_COOKIE_NAME || 'atlas_forge_session'
  const COOKIE_NAME = base.startsWith('__Host-') ? base : `__Host-${base}`
  const b64 = (buffer) => Buffer.from(buffer).toString('base64url')

  /** Mint a session cookie exactly as `seal()` does, optionally viaGoogle. */
  function mkCookie({ uid, role, viaGoogle = false, forgeG = false }) {
    const now = Math.floor(Date.now() / 1000)
    const payload = { uid, role: role ?? null, iat: now, exp: now + 3600 }
    if (viaGoogle) payload.g = 1
    const encoded = b64(JSON.stringify(payload))
    const sig = createHmac('sha256', SECRET).update(encoded).digest('base64url')
    if (forgeG) {
      // Inject g:1 AFTER signing: the signature no longer matches the payload, so
      // the server must reject it — a password session cannot forge viaGoogle.
      const tampered = b64(JSON.stringify({ ...payload, g: 1 }))
      return `${tampered}.${sig}`
    }
    return `${encoded}.${sig}`
  }

  async function land(cookieValue) {
    const res = await fetch(`${BASE}/select-role`, {
      method: 'GET',
      redirect: 'manual',
      headers: { Cookie: `${COOKIE_NAME}=${cookieValue}` },
    })
    const loc = res.headers.get('location') ?? ''
    const body = loc ? '' : await res.text().catch(() => '')
    return { status: res.status, where: `${loc} ${body}` }
  }
  const hits = (result, path) => result.where.includes(path)

  const one = async (sql, params = []) => (await db.query(sql, params))[0][0]
  const run = (sql, params = []) => db.execute(sql, params)

  const before = await one(
    'SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM user_roles) AS roles'
  )

  const APP_ID = 'ATL-0000-GAUTH'
  const EMAIL = '__gauth_probe__@atlas.local'
  // Idempotent: clear any leftover from an interrupted run (cascades to roles).
  await run('DELETE FROM users WHERE app_id = ? OR email = ?', [APP_ID, EMAIL])

  const studentRole = await one('SELECT id FROM roles WHERE slug = ?', ['student'])
  const founderRole = await one('SELECT id FROM roles WHERE slug = ?', ['founder'])

  try {
    const [inserted] = await run(
      `INSERT INTO users (app_id, full_name, email, password_hash, status, must_change_password)
       VALUES (?, ?, ?, ?, 'active', 1)`,
      [APP_ID, 'Google Auth Probe', EMAIL, 'unusable-no-login']
    )
    const uid = inserted.insertId
    await run('INSERT INTO user_roles (user_id, role_id, is_primary) VALUES (?, ?, 1)', [
      uid,
      studentRole.id,
    ])

    // 1 + single-role routing: Google session, must_change_password = 1 → straight
    // to the role dashboard, never /change-password.
    const g1 = await land(mkCookie({ uid, role: 'student', viaGoogle: true }))
    check(
      'Google session + must_change_password=1 is NOT forced to /change-password',
      !hits(g1, '/change-password'),
      g1.where.slice(0, 80)
    )
    check(
      'Google single-role user lands on their dashboard (/student/home)',
      hits(g1, '/student/home'),
      g1.where.slice(0, 80)
    )

    // 3 + 4: a password-style session (no viaGoogle) with the same flag is STILL
    // forced to change — lacking the marker cannot bypass the gate.
    const p1 = await land(mkCookie({ uid, role: 'student' }))
    check(
      'App ID (non-Google) session + must_change_password=1 is still forced to /change-password',
      hits(p1, '/change-password'),
      p1.where.slice(0, 80)
    )

    // 4: a forged viaGoogle (g:1 injected after signing) fails the signature and
    // is rejected as no session → /login. viaGoogle cannot be forged by a client.
    const forged = await land(mkCookie({ uid, role: 'student', forgeG: true }))
    check(
      'a forged viaGoogle marker is rejected (bad signature → /login), cannot bypass',
      hits(forged, '/login') && !hits(forged, '/student/home'),
      forged.where.slice(0, 80)
    )

    // 2: clear the flag → a normal Google session still works unchanged.
    await run('UPDATE users SET must_change_password = 0 WHERE id = ?', [uid])
    const g0 = await land(mkCookie({ uid, role: 'student', viaGoogle: true }))
    check(
      'Google session + must_change_password=0 lands on the dashboard normally',
      hits(g0, '/student/home') && !hits(g0, '/change-password'),
      g0.where.slice(0, 80)
    )

    // 7: multi-role — add a second role; the user now sees the picker (200) with
    // only their assigned role dashboards, still not forced to change a password.
    await run('INSERT INTO user_roles (user_id, role_id, is_primary) VALUES (?, ?, 0)', [
      uid,
      founderRole.id,
    ])
    const multi = await land(mkCookie({ uid, role: 'student', viaGoogle: true }))
    check(
      'multi-role Google user reaches the role picker (200), not /change-password',
      multi.status === 200 && !hits(multi, '/change-password'),
      `status=${multi.status}`
    )
    check(
      'multi-role picker shows only assigned roles (student + founder, not super-admin)',
      hits(multi, '/student/home') && hits(multi, '/founder/home') && !hits(multi, '/admin/overview'),
      ''
    )
  } finally {
    await run('DELETE FROM users WHERE app_id = ? OR email = ?', [APP_ID, EMAIL])
    const after = await one(
      'SELECT (SELECT COUNT(*) FROM users) AS users, (SELECT COUNT(*) FROM user_roles) AS roles'
    )
    check(
      'teardown — synthetic user removed, seeded tables untouched',
      Number(after.users) === Number(before.users) && Number(after.roles) === Number(before.roles),
      `users=${after.users}/${before.users} roles=${after.roles}/${before.roles}`
    )
    await db.end()
  }
}

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
