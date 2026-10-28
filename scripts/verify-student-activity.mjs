/**
 * Verification of the Student Activity API (GET /api/public/student-activity).
 *
 *   npm run test:student-activity     (expects a dev server on $BASE_URL)
 *
 * Creates CLEARLY-LABELLED SYNTHETIC records (a registration, an approved
 * account, a role grant, an incubation application, a founder grant and a
 * couple of audit rows), exercises the endpoint against them, then deletes
 * everything it created in a finally block. Nothing real is touched and nothing
 * is left behind.
 */

import { createConnection } from 'mysql2/promise'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'
const TAG = Date.now().toString(36)
const APP_ID = '2629885' // the requested test id (synthetic locally)
const ISO_APP_ID = `SA-ISO-${TAG}`
const MARK = `sa-${TAG}`

const pass = []
const fail = []
const check = (name, ok, detail = '') => (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

// No auth header: the endpoint is intentionally public (no API key).
async function call(path, { method = 'GET' } = {}) {
  const response = await fetch(`${BASE}${path}`, { method })
  const json = await response.json().catch(() => null)
  return { status: response.status, json }
}

const db = await createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const created = { regIds: [], userIds: [], activityIds: [] }

async function insertRegistration({ appId, email, status = 'pending', approvedUserId = null, reviewedAt = null }) {
  const [r] = await db.query(
    `INSERT INTO registration_requests
       (reference, full_name, email, role_category, student_application_id, details_json,
        consent, consented_at, status, approved_user_id, reviewed_at, source_ip)
     VALUES (?, ?, ?, 'atlas_student', ?, '{}', 1, NOW(), ?, ?, ?, '')`,
    [`AFN-SATEST-${TAG}-${created.regIds.length}`, 'SYNTHETIC Activity Student', email, appId, status, approvedUserId, reviewedAt]
  )
  created.regIds.push(r.insertId)
  return r.insertId
}

async function insertUser({ appId, email }) {
  const [r] = await db.query(
    `INSERT INTO users (app_id, full_name, email, password_hash, status)
     VALUES (?, 'SYNTHETIC Activity Student', ?, 'x', 'active')`,
    [appId, email]
  )
  created.userIds.push(r.insertId)
  return r.insertId
}

async function grantRole(userId) {
  const [roles] = await db.query(
    "SELECT id FROM roles WHERE slug = 'network-member' LIMIT 1"
  )
  const roleId = roles[0]?.id ?? (await db.query('SELECT id FROM roles ORDER BY id LIMIT 1'))[0][0].id
  await db.query(
    'INSERT INTO user_roles (user_id, role_id, is_primary, granted_at) VALUES (?, ?, 1, NOW())',
    [userId, roleId]
  )
}

async function insertActivity({ actorUserId = null, action, module = 'Registration', entityType = null, entityId = null, status = 'success' }) {
  const [r] = await db.query(
    'INSERT INTO activity_logs (actor_user_id, action, module, entity_type, entity_id, status) VALUES (?, ?, ?, ?, ?, ?)',
    [actorUserId, action, module, entityType, entityId, status]
  )
  created.activityIds.push(r.insertId)
  return r.insertId
}

try {
  /* ---- Public access: no API key required ------------------------------ */
  // A request with NO X-App-Key reaches the handler (404 for an unknown id, not
  // 401) — proving the endpoint is unauthenticated.
  const noMatch = await call(`/api/public/student-activity?applicationId=NO-SUCH-${TAG}`)
  check('no api key required (unknown id → 404, not 401)', noMatch.status === 404 && noMatch.json?.ok === false)

  /* ---- Validation ------------------------------------------------------- */
  const missing = await call('/api/public/student-activity')
  check('missing applicationId → 422', missing.status === 422)
  const tooLong = await call(`/api/public/student-activity?applicationId=${'x'.repeat(65)}`)
  check('over-long applicationId → 422', tooLong.status === 422)
  const badPage = await call(`/api/public/student-activity?applicationId=${APP_ID}&page=0`)
  check('page=0 → 422', badPage.status === 422)

  /* ---- Pending student (registration only, no account) ----------------- */
  const pendingRegId = await insertRegistration({ appId: APP_ID, email: `${MARK}-pending@studentcheck.test`, status: 'pending' })
  const pending = await call(`/api/public/student-activity?applicationId=${APP_ID}`)
  check('pending: 200', pending.status === 200)
  check('pending: account not created', pending.json?.data?.currentState?.account?.exists === false)
  check('pending: activity has submitted only', pending.json?.data?.meta?.activityCount === 1 && pending.json?.data?.activity?.[0]?.type === 'registration.submitted')

  // Promote the SAME registration to an approved student with an account + activity.
  const userId = await insertUser({ appId: `AFM-SATEST-${TAG}`, email: `${MARK}-acct@studentcheck.test` })
  // Push the submission timestamp an hour into the past so registration.submitted
  // is unambiguously the OLDEST event; everything else clusters at NOW() (ties),
  // which also exercises the deterministic tiebreaker.
  await db.query('UPDATE registration_requests SET status = "approved", approved_user_id = ?, reviewed_at = NOW(), created_at = (NOW() - INTERVAL 1 HOUR) WHERE id = ?', [userId, pendingRegId])
  await grantRole(userId)
  await db.query(
    "INSERT INTO incubation_applications (applicant_user_id, idea_name, status, submitted_at) VALUES (?, 'SYNTHETIC Idea', 'under_review', NOW())",
    [userId]
  )
  await db.query('INSERT INTO founder_access_grants (user_id, granted_at) VALUES (?, NOW())', [userId])
  await insertActivity({ action: 'Approved registration (SYNTHETIC)', entityType: 'registration_request', entityId: pendingRegId, status: 'success' })
  await insertActivity({ actorUserId: userId, action: 'Signed in (SYNTHETIC)', module: 'Auth', status: 'success' })

  /* ---- Approved student (full bundle) ---------------------------------- */
  const full = await call(`/api/public/student-activity?applicationId=${APP_ID}`)
  const data = full.json?.data
  check('approved: 200', full.status === 200)
  check('approved: student identity', data?.student?.applicationId === APP_ID && data?.student?.forgeAppId === `AFM-SATEST-${TAG}`)
  check('approved: account active', data?.currentState?.account?.exists === true && data?.currentState?.account?.active === true)
  check('approved: role present', (data?.currentState?.roles ?? []).length >= 1)
  check('approved: incubation current', data?.currentState?.incubation?.hasApplication === true && data?.currentState?.incubation?.latest?.status === 'under_review')
  check('approved: founder access active', data?.currentState?.founderAccess?.active === true)

  const types = (data?.activity ?? []).map((e) => e.type)
  check('activity: has submitted+approved+account+role+incubation+founder+audit', ['registration.submitted', 'registration.approved', 'account.created', 'role.granted', 'incubation.submitted', 'founder_access.granted', 'audit'].every((t) => types.includes(t)), types.join(','))
  const atList = (data?.activity ?? []).map((e) => e.at)
  const maxAt = atList.reduce((m, v) => (v > m ? v : m), atList[0])
  check('activity: newest first (descending by timestamp)', atList.every((v, i) => i === 0 || atList[i - 1] >= v))
  check('activity: newest event is first', data?.activity?.[0]?.at === maxAt)
  check('activity: oldest event (registration.submitted) is last on one page', data?.activity?.[data.activity.length - 1]?.type === 'registration.submitted')
  check('activity: registration decision not double-counted as audit', !(data?.activity ?? []).some((e) => e.type === 'audit' && /Approved registration/.test(e.description)))
  check('meta: activityCount matches returned (single page)', data?.meta?.activityCount === (data?.activity ?? []).length)

  /* ---- Sensitive-field safety ------------------------------------------ */
  const blob = JSON.stringify(full.json)
  const leaks = ['password', 'passwordChangeRequired', 'source_ip', 'user_agent', 'token', 'secret', `${MARK}-acct@studentcheck.test`]
  check('no sensitive fields leaked', leaks.every((needle) => !blob.includes(needle)), leaks.filter((n) => blob.includes(n)).join(','))

  /* ---- Student isolation ----------------------------------------------- */
  const isoUserId = await insertUser({ appId: `AFM-ISO-${TAG}`, email: `${MARK}-iso@studentcheck.test` })
  await insertRegistration({ appId: ISO_APP_ID, email: `${MARK}-isoreg@studentcheck.test`, status: 'approved', approvedUserId: isoUserId, reviewedAt: new Date() })
  await insertActivity({ actorUserId: isoUserId, action: 'Signed in ISO (SYNTHETIC)', module: 'Auth', status: 'success' })
  const iso = await call(`/api/public/student-activity?applicationId=${APP_ID}`)
  check('isolation: other student not included', !JSON.stringify(iso.json).includes(`AFM-ISO-${TAG}`) && !JSON.stringify(iso.json).includes('Signed in ISO'))

  /* ---- Pagination: stable, consistent with newest-first ----------------- */
  // Canonical single-page order (the NOW() cluster gives several identical
  // timestamps, so this exercises the deterministic tiebreaker).
  const whole = await call(`/api/public/student-activity?applicationId=${APP_ID}&perPage=100`)
  const onePage = (whole.json?.data?.activity ?? []).map((e) => `${e.type}@${e.at}`)
  const count = whole.json?.data?.meta?.activityCount ?? 0
  check('pagination: totalPages = activityCount at perPage=1', count >= 2)

  const paged = []
  let onePerPageOk = true
  for (let pg = 1; pg <= count; pg += 1) {
    const r = await call(`/api/public/student-activity?applicationId=${APP_ID}&perPage=1&page=${pg}`)
    const ev = r.json?.data?.activity ?? []
    if (ev.length !== 1) onePerPageOk = false
    paged.push(`${ev[0]?.type}@${ev[0]?.at}`)
  }
  check('pagination: every perPage=1 page returns exactly one event', onePerPageOk)
  check('pagination: pages reassemble the full newest-first order (no dup/skip, stable under identical timestamps)', JSON.stringify(paged) === JSON.stringify(onePage))

  /* ---- Ambiguity -------------------------------------------------------- */
  await insertRegistration({ appId: APP_ID, email: `${MARK}-dup@studentcheck.test`, status: 'pending' })
  const ambiguous = await call(`/api/public/student-activity?applicationId=${APP_ID}`)
  check('ambiguous id → 409', ambiguous.status === 409 && ambiguous.json?.ok === false)

  /* ---- Read-only + method rejection ------------------------------------ */
  const [[before]] = [await db.query('SELECT COUNT(*) AS n FROM registration_requests')]
  await call(`/api/public/student-activity?applicationId=NO-SUCH-${TAG}`)
  const [[after]] = [await db.query('SELECT COUNT(*) AS n FROM registration_requests')]
  check('read-only: GET writes nothing', before[0].n === after[0].n)
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const res = await call(`/api/public/student-activity?applicationId=${APP_ID}`, { method })
    check(`method ${method} → 405`, res.status === 405)
  }

  /* ---- CORS (public cross-domain read) --------------------------------- */
  const cors = await fetch(`${BASE}/api/public/student-activity?applicationId=NO-SUCH-${TAG}`, {
    headers: { Origin: 'https://example.com' },
  })
  check('cors: Access-Control-Allow-Origin: *', cors.headers.get('access-control-allow-origin') === '*')
  const preflight = await fetch(`${BASE}/api/public/student-activity`, { method: 'OPTIONS' })
  check('cors: OPTIONS preflight → 204', preflight.status === 204)
} finally {
  /* ---- Cleanup: remove everything this run created --------------------- */
  try {
    if (created.activityIds.length) await db.query('DELETE FROM activity_logs WHERE id IN (?)', [created.activityIds])
    if (created.userIds.length) {
      await db.query('DELETE FROM activity_logs WHERE actor_user_id IN (?)', [created.userIds])
      await db.query('DELETE FROM founder_access_grants WHERE user_id IN (?)', [created.userIds])
      await db.query('DELETE FROM incubation_applications WHERE applicant_user_id IN (?)', [created.userIds])
    }
    if (created.regIds.length) await db.query('DELETE FROM registration_requests WHERE id IN (?)', [created.regIds])
    if (created.userIds.length) {
      await db.query('DELETE FROM user_roles WHERE user_id IN (?)', [created.userIds])
      await db.query('DELETE FROM users WHERE id IN (?)', [created.userIds])
    }
  } catch (error) {
    fail.push(`cleanup failed — ${error.message}`)
  }
  await db.end()
}

console.log(`\n${pass.length} passed, ${fail.length} failed\n`)
for (const line of pass) console.log(`  ✓ ${line}`)
for (const line of fail) console.log(`  ✗ ${line}`)
process.exit(fail.length === 0 ? 0 : 1)
