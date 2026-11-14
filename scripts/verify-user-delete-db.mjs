/**
 * PERMANENT user delete against the REAL database.
 *
 *   npm run test:delete:db        (needs migration 015 applied; no server)
 *
 * Builds a throwaway founder with rows in every table the delete touches,
 * then checks: the preview counts, the email confirmation, "not yourself",
 * "not the last Backend Manager", that a failure part-way rolls EVERYTHING
 * back (one transaction), and finally the real delete — including that the
 * startup is kept with no owner and the audit entry holds no personal data.
 * Everything it creates is removed at the end.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

import { T } from '../src/lib/queries/tables.mjs'

// Resolve the app's "@/..." alias and stub the Next-only modules the guard
// pulls in, so the module layer can be imported outside a Next runtime.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
  import { statSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'

  // Must be a FILE: "@/lib/modules/student" also names a directory, and Node
  // refuses a directory import, so the candidate order below tries the
  // extensioned forms first and never accepts a folder.
  const isFile = (url) => {
    try { return statSync(fileURLToPath(url)).isFile() } catch { return false }
  }
  const ROOT = ${JSON.stringify(pathToFileURL(process.cwd()).href)}

  const STUBS = {
    'server-only': 'data:text/javascript,',
    'next/headers': 'data:text/javascript,' + encodeURIComponent(
      'export const cookies = async () => ({ get: () => undefined, set: () => {} })'),
    'next/navigation': 'data:text/javascript,' + encodeURIComponent(
      'export const redirect = (to) => { throw new Error("redirect:" + to) }'),
  }

  export async function resolve(specifier, context, next) {
    if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true }

    const base =
      specifier.startsWith('@/')
        ? new URL('src/' + specifier.slice(2), ROOT + '/').href
        : specifier.startsWith('.') && context.parentURL
          ? new URL(specifier, context.parentURL).href
          : null

    if (base) {
      for (const candidate of [base + '.js', base + '/index.js', base]) {
        if (isFile(candidate)) return next(candidate, context)
      }
      return next(base + '.js', context)
    }
    return next(specifier, context)
  }
`),
  pathToFileURL('./')
)

const pass = []
const fail = []
const check = (name, ok, detail = '') => (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

const db = await import('@/lib/db')
const { execute, insert, queryValue, transaction, closePool } = db
const { userDeletionService } = await import('@/lib/services')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — permanent user delete (database)\n')

const TAG = `d${Date.now().toString(36)}`
const value = async (sql, params = []) => Number(await queryValue(sql, params))
const errorOf = (promise) => promise.then(() => null, (error) => error)
const roleId = async (slug) => value(`SELECT id FROM ${T.roles} WHERE slug = ?`, [slug])

async function makeUser(appId, email, slug) {
  const id = await usersRepo.create({ appId, name: `Del ${slug}`, email, passwordHash: 'x' })
  const role = await roleId(slug)
  await transaction((tx) => usersRepo.setSingleRole(id, role, {}, tx))
  return id
}

let founderId = null
let otherId = null
let startupId = null
const PROBE = 'forge_zz_delete_probe'

try {
  const kabir = await usersRepo.findByAppId('ATL-2020-0002') // the only Backend Manager
  const founderEmail = `${TAG}-founder@gmail.com`
  const founderAppId = `AFX-${TAG}`
  founderId = await makeUser(founderAppId, founderEmail, 'founder')
  otherId = await makeUser(`AFM-${TAG}`, `${TAG}-other@gmail.com`, 'student')

  startupId = await insert(`INSERT INTO ${T.startups} (slug, name, owner_user_id) VALUES (?, ?, ?)`, [`${TAG}-st`, `Startup ${TAG}`, founderId])
  await execute(`INSERT INTO ${T.startup_members} (startup_id, user_id, role_title) VALUES (?, ?, 'Founder')`, [startupId, founderId])
  const listingId = await insert(`INSERT INTO ${T.listings} (title, created_by, startup_id) VALUES (?, ?, ?)`, [`L ${TAG}`, founderId, startupId])
  const seededListing = await value(`SELECT MIN(id) FROM ${T.listings} WHERE created_by <> ?`, [founderId])
  await execute(`INSERT INTO ${T.applications} (listing_id, applicant_user_id) VALUES (?, ?)`, [listingId, otherId])
  await execute(`INSERT INTO ${T.applications} (listing_id, applicant_user_id) VALUES (?, ?)`, [seededListing, founderId])
  await execute(`INSERT INTO ${T.contracts} (founder_user_id, student_user_id, title) VALUES (?, ?, 'C')`, [founderId, otherId])
  await execute(`INSERT INTO ${T.concierge_contacts} (founder_user_id, student_user_id, context) VALUES (?, ?, 'ctx')`, [founderId, otherId])
  await execute(`INSERT INTO ${T.messages} (sender_user_id, recipient_user_id, subject, body) VALUES (?, ?, 's', 'b')`, [otherId, founderId])
  await execute(`INSERT INTO ${T.posted_needs} (founder_user_id, title) VALUES (?, 'need')`, [founderId])
  await execute(`INSERT INTO ${T.mentorship_requests} (requester_user_id, topic) VALUES (?, 't')`, [founderId])
  await execute(`INSERT INTO ${T.mentorship_sessions} (mentee_user_id, topic) VALUES (?, 't')`, [founderId])
  await execute(`INSERT INTO ${T.incubation_applications} (applicant_user_id, idea_name) VALUES (?, 'idea')`, [founderId])
  await execute(
    `INSERT INTO ${T.registration_requests} (reference, full_name, email, role_category, status, approved_user_id) VALUES (?, 'R', ?, 'others', 'approved', ?)`,
    [`AFN-${TAG}`.slice(0, 24), founderEmail, founderId]
  )
  await execute(
    `INSERT INTO ${T.outsider_incubation_applications} (reference, full_name, email, phone, startup_name, pitch_deck, key_personnel, approved_user_id)
     VALUES (?, 'R', ?, '1', 'S', 'x', 'y', ?)`,
    [`AFI-${TAG}`.slice(0, 24), founderEmail, founderId]
  )
  await execute(`INSERT INTO ${T.login_attempts} (identifier, action, succeeded) VALUES (?, 'login', 0)`, [founderAppId])
  await execute(`INSERT INTO ${T.notifications} (user_id, type, title) VALUES (?, 'access', 'n')`, [founderId])
  const keptLog = await insert(`INSERT INTO ${T.activity_logs} (actor_user_id, action, module) VALUES (?, ?, 'Test')`, [founderId, `log ${TAG}`])

  // --- Preview -------------------------------------------------------------
  const preview = await userDeletionService.previewDelete({ userId: founderId, actorId: kabir.id })
  const count = (key) => preview.removed.find((item) => item.key === key)?.count ?? 0
  const expected = {
    listingApplications: 1, applications: 1, contracts: 1, listings: 1, mentorshipSessions: 1,
    mentorshipRequests: 1, messages: 1, contacts: 1, postedNeeds: 1, registrations: 1,
    outsiderApplications: 1, incubationApplications: 1, loginAttempts: 1, roles: 1,
    notifications: 1, startupMembership: 1,
  }
  const wrong = Object.entries(expected).filter(([key, n]) => count(key) !== n)
  check('preview counts every row that will go', wrong.length === 0, wrong.map(([k]) => `${k}=${count(k)}`).join(' ') || 'all match')
  check('preview says the startup is kept without owner', preview.startupsKeptWithoutOwner === 1)
  check('preview is read-only', (await value(`SELECT COUNT(*) FROM ${T.users} WHERE id = ?`, [founderId])) === 1)

  // --- Refusals ------------------------------------------------------------
  let error = await errorOf(userDeletionService.hardDeleteUser({ userId: founderId, actorId: kabir.id, confirmEmail: 'wrong@x.com' }))
  check('wrong confirmation email is refused (422)', error?.status === 422, error?.message)
  error = await errorOf(userDeletionService.hardDeleteUser({ userId: founderId, actorId: kabir.id, confirmEmail: '' }))
  check('empty confirmation email is refused', error?.status === 422)
  error = await errorOf(userDeletionService.hardDeleteUser({ userId: kabir.id, actorId: kabir.id, confirmEmail: kabir.email }))
  check('you cannot delete yourself (403)', error?.status === 403, error?.message)
  error = await errorOf(userDeletionService.hardDeleteUser({ userId: kabir.id, actorId: founderId, confirmEmail: kabir.email }))
  check('the last Backend Manager cannot be deleted (409)', error?.status === 409, error?.message)
  check('…and still exists', (await value(`SELECT COUNT(*) FROM ${T.users} WHERE id = ?`, [kabir.id])) === 1)

  // --- All or nothing --------------------------------------------------------
  // A probe table with a RESTRICT foreign key makes the very LAST step (the
  // user row) fail, after every child delete already ran inside the transaction.
  await execute(`DROP TABLE IF EXISTS ${PROBE}`)
  await execute(
    `CREATE TABLE ${PROBE} (user_id BIGINT UNSIGNED NOT NULL,
       CONSTRAINT fk_zz_probe FOREIGN KEY (user_id) REFERENCES ${T.users} (id) ON DELETE RESTRICT) ENGINE=InnoDB`
  )
  await execute(`INSERT INTO ${PROBE} (user_id) VALUES (?)`, [founderId])
  error = await errorOf(userDeletionService.hardDeleteUser({ userId: founderId, actorId: kabir.id, confirmEmail: founderEmail.toUpperCase() }))
  check('a failure at the last step aborts the delete', Boolean(error), error?.code ?? error?.message)
  const survived = await value(
    `SELECT (SELECT COUNT(*) FROM ${T.listings} WHERE created_by = ?) + (SELECT COUNT(*) FROM ${T.messages} WHERE recipient_user_id = ?)
          + (SELECT COUNT(*) FROM ${T.applications} WHERE listing_id = ?) + (SELECT COUNT(*) FROM ${T.users} WHERE id = ?)
          + (SELECT COUNT(*) FROM ${T.registration_requests} WHERE approved_user_id = ?)`,
    [founderId, founderId, listingId, founderId, founderId]
  )
  check('…and rolls back every earlier step (nothing half-deleted)', survived === 5, `${survived}/5 rows still there`)
  await execute(`DROP TABLE ${PROBE}`)

  // --- The real delete -----------------------------------------------------
  const result = await userDeletionService.hardDeleteUser({ userId: founderId, actorId: kabir.id, confirmEmail: ` ${founderEmail.toUpperCase()} ` })
  check('delete succeeds with the email typed in any case', result.deleted === true)
  check('the user row is gone', (await value(`SELECT COUNT(*) FROM ${T.users} WHERE id = ?`, [founderId])) === 0)
  const leftovers = await value(
    `SELECT (SELECT COUNT(*) FROM ${T.applications} WHERE applicant_user_id = ? OR listing_id = ?)
          + (SELECT COUNT(*) FROM ${T.listings} WHERE id = ?)
          + (SELECT COUNT(*) FROM ${T.contracts} WHERE founder_user_id = ?)
          + (SELECT COUNT(*) FROM ${T.messages} WHERE recipient_user_id = ?)
          + (SELECT COUNT(*) FROM ${T.concierge_contacts} WHERE founder_user_id = ?)
          + (SELECT COUNT(*) FROM ${T.user_roles} WHERE user_id = ?)
          + (SELECT COUNT(*) FROM ${T.registration_requests} WHERE email = ?)
          + (SELECT COUNT(*) FROM ${T.outsider_incubation_applications} WHERE email = ?)
          + (SELECT COUNT(*) FROM ${T.login_attempts} WHERE identifier = ?)
          + (SELECT COUNT(*) FROM ${T.startup_members} WHERE user_id = ?)
          + (SELECT COUNT(*) FROM ${T.incubation_applications} WHERE applicant_user_id = ?)`,
    [founderId, listingId, listingId, founderId, founderId, founderId, founderId, founderEmail, founderEmail, founderAppId, founderId, founderId]
  )
  check('every dependent row is gone', leftovers === 0, `${leftovers} left`)
  check('the other person still exists (only shared rows were removed)', (await value(`SELECT COUNT(*) FROM ${T.users} WHERE id = ?`, [otherId])) === 1)
  check('the startup is kept, with no owner',
    (await value(`SELECT COUNT(*) FROM ${T.startups} WHERE id = ? AND owner_user_id IS NULL`, [startupId])) === 1)
  check('old activity by the user is kept, actor set to NULL',
    (await value(`SELECT COUNT(*) FROM ${T.activity_logs} WHERE id = ? AND actor_user_id IS NULL`, [keptLog])) === 1)
  const audit = await queryValue(
    `SELECT action FROM ${T.activity_logs} WHERE actor_user_id = ? AND entity_type = 'user' AND entity_id = ? ORDER BY id DESC LIMIT 1`,
    [kabir.id, founderId]
  )
  check('audit entry names who/what by id and App ID', String(audit).includes(`#${founderId}`) && String(audit).includes(founderAppId), String(audit))
  check('audit entry holds no email or name', !String(audit).includes('@') && !String(audit).includes('Del founder'))
  const auditTime = await value(
    `SELECT COUNT(*) FROM ${T.activity_logs} WHERE actor_user_id = ? AND entity_id = ? AND created_at >= NOW() - INTERVAL 5 MINUTE`,
    [kabir.id, founderId]
  )
  check('audit entry records when', auditTime >= 1)
  error = await errorOf(userDeletionService.hardDeleteUser({ userId: founderId, actorId: kabir.id, confirmEmail: founderEmail }))
  check('deleting again is a 404', error?.status === 404)
} catch (error) {
  fail.push(`unexpected error: ${error.stack ?? error}`)
} finally {
  await execute(`DROP TABLE IF EXISTS ${PROBE}`).catch(() => {})
  const ids = [founderId, otherId].filter(Boolean)
  if (ids.length) {
    const ph = ids.map(() => '?').join(',')
    for (const sql of [
      `DELETE FROM ${T.applications} WHERE applicant_user_id IN (${ph})`,
      `DELETE FROM ${T.messages} WHERE sender_user_id IN (${ph}) OR recipient_user_id IN (${ph})`,
      `DELETE FROM ${T.contracts} WHERE founder_user_id IN (${ph}) OR student_user_id IN (${ph})`,
      `DELETE FROM ${T.concierge_contacts} WHERE founder_user_id IN (${ph}) OR student_user_id IN (${ph})`,
      `DELETE FROM ${T.activity_logs} WHERE entity_type = 'user' AND entity_id IN (${ph})`,
      `DELETE FROM ${T.activity_logs} WHERE action LIKE ?`,
      `DELETE FROM ${T.users} WHERE id IN (${ph})`,
    ]) {
      const n = (sql.match(/\?/g) ?? []).length
      const params = sql.includes('LIKE') ? [`log ${TAG}`] : Array.from({ length: n }, (_, i) => ids[i % ids.length])
      await execute(sql, params).catch((error) => fail.push(`cleanup: ${error.message}`))
    }
  }
  if (startupId) await execute(`DELETE FROM ${T.startups} WHERE id = ?`, [startupId]).catch(() => {})
}

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)
await closePool()
process.exit(fail.length === 0 ? 0 : 1)
