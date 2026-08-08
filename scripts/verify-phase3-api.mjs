/**
 * Verifies the endpoints added for services that already existed but had no
 * route: notifications, messages, application history, password change,
 * Concierge contact status, posted needs, and error capture.
 *
 *   npm run test:phase3          (expects a server on $BASE_URL)
 *
 * None of these have a UI — the reference set draws no screen for any of them —
 * so HTTP is the only surface there is to test.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3100'
const STUDENT = 'ATL-2024-0871'
const FOUNDER = 'ATL-2022-0012'
const MANAGER = 'ATL-2020-0001'
const OTHER_STUDENT = 'ATL-2021-0119'
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

async function signIn(appId, password = PASSWORD) {
  const cookies = jar()
  const response = await call('/api/auth/login', {
    method: 'POST',
    body: { appId, password },
    cookies,
  })
  return { cookies, status: response.status }
}

const mysql = (await import('mysql2/promise')).default
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME,
})
const one = async (sql, params = []) => (await db.execute(sql, params))[0][0]

const before = await one(`
  SELECT COALESCE((SELECT MAX(id) FROM posted_needs), 0)   AS needs,
         COALESCE((SELECT MAX(id) FROM activity_logs), 0)  AS activity,
         COALESCE((SELECT MAX(id) FROM error_logs), 0)     AS errors,
         (SELECT COUNT(*) FROM error_logs)                 AS errorCount
`)

console.log(`\nATLAS Forge - Phase 3 endpoint verification (${BASE})\n`)

/* -------------------------------------------------------------------------- */
/* Notifications                                                              */
/* -------------------------------------------------------------------------- */

check('notifications are closed to anonymous callers',
  (await call('/api/notifications')).status === 401)

const { cookies: riya } = await signIn(STUDENT)
const notifications = await json(await call('/api/notifications', { cookies: riya }))
check('GET /api/notifications returns the caller’s own', notifications?.data?.notifications?.length === 2,
  `${notifications?.data?.notifications?.length} notifications`)
check('and an unread count', notifications?.data?.unread === 2, String(notifications?.data?.unread))
check('each row carries a link and a timestamp',
  notifications.data.notifications.every((row) => row.href && row.meta),
  notifications.data.notifications[0]?.meta)

const target = notifications.data.notifications[0]
const marked = await call(`/api/notifications/${target.id}`, { method: 'PATCH', cookies: riya })
check('PATCH marking one read is 200', marked.status === 200, String(marked.status))

const afterRead = await json(await call('/api/notifications', { cookies: riya }))
check('the unread count drops', afterRead.data.unread === 1, String(afterRead.data.unread))
check('and the row is flagged read',
  afterRead.data.notifications.find((row) => row.id === target.id)?.isRead === true)

const { cookies: priya } = await signIn(OTHER_STUDENT)
check('another account cannot mark it read — 404, not 403',
  (await call(`/api/notifications/${target.id}`, { method: 'PATCH', cookies: priya })).status === 404)
check('and never sees it in their own list',
  (await json(await call('/api/notifications', { cookies: priya })))
    .data.notifications.every((row) => row.id !== target.id))

/* -------------------------------------------------------------------------- */
/* Messages                                                                   */
/* -------------------------------------------------------------------------- */

const { cookies: mihir } = await signIn(MANAGER)
const managerInbox = await json(await call('/api/messages', { cookies: mihir }))
check('GET /api/messages returns what the Forge Manager received',
  managerInbox?.data?.received?.length === 2, `${managerInbox?.data?.received?.length} received`)

const studentOutbox = await json(await call('/api/messages', { cookies: riya }))
check('and what a student sent', studentOutbox?.data?.sent?.length === 1,
  `${studentOutbox?.data?.sent?.length} sent`)
check('a student’s inbox does not contain the manager’s mail',
  studentOutbox.data.received.length === 0)

/* -------------------------------------------------------------------------- */
/* Application history                                                        */
/* -------------------------------------------------------------------------- */

const applications = await json(await call('/api/student/applications', { cookies: riya }))
const application = applications.data.applications[0]

const history = await json(
  await call(`/api/student/applications/${application.applicationId}`, { cookies: riya })
)
check('GET application history is readable by the applicant',
  Array.isArray(history?.data?.history) && history.data.history.length >= 1,
  `${history?.data?.history?.length} events`)
check('and reports the current status', Boolean(history?.data?.status), history?.data?.status)

const { cookies: shantanu } = await signIn(FOUNDER)
check('the founder who posted the listing can read it too',
  (await call(`/api/student/applications/${application.applicationId}`, { cookies: shantanu }))
    .status === 200)
check('an unrelated student cannot — 404, not 403',
  (await call(`/api/student/applications/${application.applicationId}`, { cookies: priya }))
    .status === 404)
check('an application that does not exist is 404',
  (await call('/api/student/applications/999999', { cookies: riya })).status === 404)

/* -------------------------------------------------------------------------- */
/* Concierge contact status                                                   */
/* -------------------------------------------------------------------------- */

const contacts = await json(await call('/api/founder/contacts', { cookies: shantanu }))
const pending = contacts.data.contacts.find((row) => row.status === 'Pending')
check('the founder has a pending outreach to move', Boolean(pending), pending?.student)

const moved = await call('/api/founder/contacts', {
  method: 'PATCH',
  body: { contactId: pending.contactId, status: 'ongoing' },
  cookies: shantanu,
})
check('PATCH a contact status is 200', moved.status === 200, String(moved.status))

const afterMove = await json(await call('/api/founder/contacts', { cookies: shantanu }))
check('and the Contact Log shows the new status',
  afterMove.data.contacts.find((row) => row.contactId === pending.contactId)?.status === 'Ongoing')

check('an unknown status is refused',
  (await call('/api/founder/contacts', {
    method: 'PATCH',
    body: { contactId: pending.contactId, status: 'nonsense' },
    cookies: shantanu,
  })).status === 422)

const foreignContact = contacts.data.contacts.length
check('another founder’s contact is 404',
  (await call('/api/founder/contacts', {
    method: 'PATCH',
    body: { contactId: 2, status: 'done' },
    cookies: shantanu,
  })).status === 404, `${foreignContact} own contacts`)

check('a student cannot move a contact at all',
  (await call('/api/founder/contacts', {
    method: 'PATCH',
    body: { contactId: pending.contactId, status: 'done' },
    cookies: riya,
  })).status === 403)

/* -------------------------------------------------------------------------- */
/* Posted needs                                                               */
/* -------------------------------------------------------------------------- */

const needsBefore = await json(await call('/api/founder/needs', { cookies: shantanu }))

const posted = await call('/api/founder/needs', {
  method: 'POST',
  body: { title: '__phase3__ Designer for onboarding', description: 'Two week engagement.' },
  cookies: shantanu,
})
check('POST a talent need is 201', posted.status === 201, String(posted.status))

const needsAfter = await json(await call('/api/founder/needs', { cookies: shantanu }))
check('and it appears on My Posted Needs',
  needsAfter.data.needs.length === needsBefore.data.needs.length + 1,
  `${needsBefore.data.needs.length} → ${needsAfter.data.needs.length}`)

check('a blank title is refused',
  (await call('/api/founder/needs', {
    method: 'POST',
    body: { title: '   ' },
    cookies: shantanu,
  })).status === 422)

check('a student cannot post a need',
  (await call('/api/founder/needs', {
    method: 'POST',
    body: { title: 'x' },
    cookies: riya,
  })).status === 403)

/* -------------------------------------------------------------------------- */
/* Password change                                                            */
/* -------------------------------------------------------------------------- */

check('changing a password is closed to anonymous callers',
  (await call('/api/auth/password', {
    method: 'POST',
    body: { currentPassword: PASSWORD, newPassword: 'Whatever@2026' },
  })).status === 401)

check('the current password must be right',
  (await call('/api/auth/password', {
    method: 'POST',
    body: { currentPassword: 'wrong', newPassword: 'Whatever@2026' },
    cookies: priya,
  })).status === 401)

check('a short password is refused',
  (await call('/api/auth/password', {
    method: 'POST',
    body: { currentPassword: PASSWORD, newPassword: 'short' },
    cookies: priya,
  })).status === 422)

check('mismatched confirmation is refused',
  (await call('/api/auth/password', {
    method: 'POST',
    body: { currentPassword: PASSWORD, newPassword: 'Whatever@2026', confirmPassword: 'Other@2026' },
    cookies: priya,
  })).status === 422)

check('reusing the current password is refused',
  (await call('/api/auth/password', {
    method: 'POST',
    body: { currentPassword: PASSWORD, newPassword: PASSWORD },
    cookies: priya,
  })).status === 422)

const changed = await call('/api/auth/password', {
  method: 'POST',
  body: { currentPassword: PASSWORD, newPassword: 'Phase3@2026', confirmPassword: 'Phase3@2026' },
  cookies: priya,
})
check('a valid change is 200', changed.status === 200, String(changed.status))

check('the old password no longer works', (await signIn(OTHER_STUDENT)).status === 401)
check('and the new one does', (await signIn(OTHER_STUDENT, 'Phase3@2026')).status === 200)

// Put it back, through the same endpoint.
const { cookies: priyaNew } = await signIn(OTHER_STUDENT, 'Phase3@2026')
const restored = await call('/api/auth/password', {
  method: 'POST',
  body: { currentPassword: 'Phase3@2026', newPassword: PASSWORD, confirmPassword: PASSWORD },
  cookies: priyaNew,
})
check('and it can be changed back', restored.status === 200, String(restored.status))
check('the seeded password works again', (await signIn(OTHER_STUDENT)).status === 200)

const hashChanged = await one(
  'SELECT password_hash FROM users WHERE app_id = ?', [OTHER_STUDENT]
)
check('the stored value is a scrypt hash, never the password itself',
  hashChanged.password_hash.startsWith('scrypt$') && !hashChanged.password_hash.includes(PASSWORD))

/* -------------------------------------------------------------------------- */
/* Error capture                                                              */
/* -------------------------------------------------------------------------- */

check('error_logs was empty before this run', Number(before.errorCount) === 0,
  String(before.errorCount))

// A handled error must NOT be recorded: a 404 is an answer, not an incident.
await call('/api/notifications/999999', { method: 'PATCH', cookies: riya })
const afterHandled = await one('SELECT COUNT(*) AS n FROM error_logs')
check('a handled 404 is not recorded as a platform error', Number(afterHandled.n) === 0,
  String(afterHandled.n))

/* -------------------------------------------------------------------------- */
/* Teardown                                                                   */
/* -------------------------------------------------------------------------- */

await db.execute("UPDATE concierge_contacts SET status = 'pending' WHERE id = ?", [
  pending.contactId,
])
await db.execute("DELETE FROM posted_needs WHERE title LIKE '__phase3__%'")
await db.execute('UPDATE notifications SET read_at = NULL WHERE id = ?', [target.id])
await db.execute('DELETE FROM activity_logs WHERE id > ?', [before.activity])
await db.execute('DELETE FROM error_logs WHERE id > ?', [before.errors])

const after = await one(`
  SELECT (SELECT COUNT(*) FROM posted_needs)                              AS needs,
         (SELECT COUNT(*) FROM activity_logs)                             AS activity,
         (SELECT COUNT(*) FROM error_logs)                                AS errors,
         (SELECT COUNT(*) FROM notifications WHERE read_at IS NOT NULL)   AS readRows,
         (SELECT COUNT(*) FROM concierge_contacts WHERE status='pending') AS pendingContacts
`)
await db.end()

check('teardown - seeded data restored',
  Number(after.needs) === 3 && Number(after.activity) === 10 && Number(after.errors) === 0 &&
    Number(after.readRows) === 0 && Number(after.pendingContacts) === 1,
  `needs=${after.needs} activity=${after.activity} errors=${after.errors} read=${after.readRows} pending=${after.pendingContacts}`)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

process.exit(fail.length === 0 ? 0 : 1)
