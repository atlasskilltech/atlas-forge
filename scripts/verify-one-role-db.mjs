/**
 * The one-role rule and the staff-email rule against the REAL database.
 *
 *   npm run test:roles:db        (needs migration 015 applied; no server)
 *
 * Every row it creates is tagged and removed at the end, so it can be run
 * repeatedly. Covers: the DB constraint (second active role refused), staff
 * creation (Atlas email only, staff roles only), role change (replaces, staff
 * email rule, not your own role, last Backend Manager kept), and registration
 * approval (Job Seeker role, Application ID as App ID, AFM App ID otherwise).
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

const { execute, query, queryValue, closePool } = await import('@/lib/db')
const { accountsService, rolesService, registrationService, authService } = await import('@/lib/services')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — one role per user (database)\n')

const TAG = `r${Date.now().toString(36)}`
const ATLAS = '@atlasuniversity.edu.in'
const created = []
const regIds = []

async function errorOf(promise) {
  try {
    await promise
    return null
  } catch (error) {
    return error
  }
}
const activeRoles = async (userId) =>
  (await query(
    `SELECT r.slug FROM ${T.user_roles} ur JOIN ${T.roles} r ON r.id = ur.role_id
      WHERE ur.user_id = ? AND ur.revoked_at IS NULL`,
    [userId]
  )).map((row) => row.slug)

try {
  const indexPresent = Number(
    await queryValue(
      `SELECT COUNT(*) FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = '${T.user_roles}' AND INDEX_NAME = 'uq_user_roles_one_active'`
    )
  )
  check('migration 015 constraint is present', indexPresent > 0)
  if (!indexPresent) throw new Error('Apply migrations/015_one_role_per_user.sql first.')

  const bm = await usersRepo.findByAppId('ATL-2022-0012') // seeded Backend Manager
  const actorId = bm.id

  // --- Staff creation -------------------------------------------------------
  let error = await errorOf(accountsService.createStaffUser({ name: 'Gmail FM', email: `${TAG}@gmail.com`, roleSlug: 'forge-manager', actorId }))
  check('staff: Forge Manager with a gmail address is refused', error?.status === 422, error?.message)
  for (const slug of ['backend-manager', 'super-admin']) {
    error = await errorOf(accountsService.createStaffUser({ name: 'X', email: `${TAG}-${slug}@yahoo.com`, roleSlug: slug, actorId }))
    check(`staff: ${slug} with a non-Atlas address is refused`, error?.status === 422, error?.message)
  }
  for (const slug of ['student', 'founder']) {
    error = await errorOf(accountsService.createStaffUser({ name: 'X', email: `${TAG}-${slug}${ATLAS}`, roleSlug: slug, actorId }))
    check(`staff: cannot create a ${slug} account here`, error?.status === 422, error?.message)
  }

  const fm = await accountsService.createStaffUser({ name: 'Test FM', email: `${TAG}-FM${ATLAS.toUpperCase()}`, roleSlug: 'forge-manager', actorId })
  created.push(fm.id)
  check('staff: Atlas email (any case) is accepted', Boolean(fm.id))
  check('staff: email stored lower-case', (await usersRepo.findById(fm.id)).email === `${TAG}-fm${ATLAS}`)
  check('staff: exactly one active role', JSON.stringify(await activeRoles(fm.id)) === '["forge-manager"]')

  // --- Database constraint --------------------------------------------------
  error = await errorOf(
    execute(`INSERT INTO ${T.user_roles} (user_id, role_id) SELECT ?, id FROM ${T.roles} WHERE slug = 'founder'`, [fm.id])
  )
  check('db: a second active role row is rejected by the unique index', error?.code === 'ER_DUP_ENTRY' || /Duplicate/.test(String(error?.message)), error?.code)

  // --- Role change ------------------------------------------------------------
  let changed = await rolesService.changeRole({ userId: fm.id, roleSlug: 'founder', actorId })
  check('change: FM → Founder replaces the role', JSON.stringify(await activeRoles(fm.id)) === '["founder"]', JSON.stringify(changed))
  changed = await rolesService.changeRole({ userId: fm.id, roleSlug: 'student', actorId })
  check('change: Founder → Job Seeker replaces the role', JSON.stringify(await activeRoles(fm.id)) === '["student"]')
  changed = await rolesService.changeRole({ userId: fm.id, roleSlug: 'founder', actorId })
  check('change: Job Seeker → Founder directly is allowed', JSON.stringify(await activeRoles(fm.id)) === '["founder"]')
  changed = await rolesService.changeRole({ userId: fm.id, roleSlug: 'backend-manager', actorId })
  check('change: → Backend Manager with an Atlas email is allowed', JSON.stringify(await activeRoles(fm.id)) === '["backend-manager"]')

  const identity = await authService.buildIdentity(fm.id)
  check('identity: exactly one role in the session identity', identity.roles.length === 1 && identity.defaultRole.slug === 'backend-manager')

  const gmailId = await usersRepo.create({ appId: `AFM-${TAG}`, name: 'Gmail Seeker', email: `${TAG}-seeker@gmail.com`, passwordHash: 'x' })
  created.push(gmailId)
  await rolesService.changeRole({ userId: gmailId, roleSlug: 'student', actorId })
  for (const slug of ['forge-manager', 'backend-manager', 'super-admin']) {
    error = await errorOf(rolesService.changeRole({ userId: gmailId, roleSlug: slug, actorId }))
    check(`change: gmail user → ${slug} is refused`, error?.status === 422, error?.message)
  }
  check('change: refused change left the role alone', JSON.stringify(await activeRoles(gmailId)) === '["student"]')
  error = await errorOf(rolesService.changeRole({ userId: gmailId, roleSlug: 'network-member', actorId }))
  check('change: network-member is not a valid role', error?.status === 422)

  error = await errorOf(rolesService.changeRole({ userId: actorId, roleSlug: 'student', actorId }))
  check('change: you cannot change your own role', error?.status === 403, error?.message)

  // Two BMs now (seed + test). Move ours away → fine; then the seed BM is the last one.
  await rolesService.changeRole({ userId: fm.id, roleSlug: 'student', actorId })
  error = await errorOf(rolesService.changeRole({ userId: actorId, roleSlug: 'student', actorId: fm.id }))
  check('change: the last Backend Manager cannot be moved', error?.status === 409, error?.message)
  check('change: …and keeps their role', JSON.stringify(await activeRoles(actorId)) === '["backend-manager"]')

  // --- Registration approval -----------------------------------------------
  const insertReg = async (category, email, studentAppId = null) => {
    const ref = `AFN-T-${TAG}-${regIds.length}`.slice(0, 24)
    const id = await (await import('@/lib/db')).insert(
      `INSERT INTO ${T.registration_requests} (reference, full_name, email, role_category, student_application_id, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [ref, `Reg ${category}`, email, category, studentAppId]
    )
    regIds.push(id)
    return id
  }

  const studentAppId = `APP-${TAG}`.toUpperCase()
  let regId = await insertReg('atlas_student', `${TAG}-stu${ATLAS}`, studentAppId)
  let approved = await registrationService.approve({ applicationId: regId, actorId })
  created.push(approved.account.id)
  check('registration: Atlas Student gets their Application ID as App ID', approved.account.appId === studentAppId, approved.account.appId)
  check('registration: approved registrant is a Job Seeker only', JSON.stringify(await activeRoles(approved.account.id)) === '["student"]')

  regId = await insertReg('atlas_student', `${TAG}-stu2${ATLAS}`, studentAppId.toLowerCase())
  error = await errorOf(registrationService.approve({ applicationId: regId, actorId }))
  check('registration: same Application ID (any case) cannot make a second user', error?.status === 409, error?.message)

  regId = await insertReg('others', `${TAG}-other@gmail.com`)
  approved = await registrationService.approve({ applicationId: regId, actorId })
  created.push(approved.account.id)
  check('registration: Others gets a generated AFM App ID', /^AFM-\d{4}-\d{5}$/.test(approved.account.appId), approved.account.appId)

  regId = await insertReg('atlas_faculty', `${TAG}-fac@gmail.com`)
  error = await errorOf(registrationService.approve({ applicationId: regId, actorId }))
  check('registration: Atlas Faculty with a gmail address cannot be approved', error?.status === 409, error?.message)

  regId = await insertReg('atlas_alumni', `${TAG}-OTHER@GMAIL.COM`)
  error = await errorOf(registrationService.approve({ applicationId: regId, actorId }))
  check('registration: an email already used (any case) cannot make a second user', error?.status === 409, error?.message)

  error = await errorOf(
    registrationService.submit({ fullName: 'Fac Gmail', email: `${TAG}-f2@gmail.com`, roleCategory: 'atlas_faculty', department: 'D', designation: 'P', willingToMentor: 'yes', conductSession: 'no', consent: true })
  )
  check('registration form: Atlas Faculty with gmail is refused on the email field', error?.status === 422 && Boolean(error?.details?.fields?.email), error?.details?.fields?.email)
  error = await errorOf(
    registrationService.submit({ fullName: 'Dup', email: `${TAG}-SEEKER@gmail.com`, roleCategory: 'others', organisation: 'O', designation: 'D', portfolioLink: 'x.com/y', consent: true })
  )
  check('registration form: an email that already has an account is refused', error?.status === 422 && Boolean(error?.details?.fields?.email), error?.details?.fields?.email)
} catch (error) {
  fail.push(`unexpected error: ${error.stack ?? error}`)
} finally {
  // Clean up everything this run created.
  if (regIds.length) await execute(`DELETE FROM ${T.registration_requests} WHERE id IN (${regIds.map(() => '?').join(',')})`, regIds)
  if (created.length) {
    const ids = created.filter(Boolean)
    const ph = ids.map(() => '?').join(',')
    await execute(`DELETE FROM ${T.founder_access_grants} WHERE user_id IN (${ph})`, ids)
    await execute(`DELETE FROM ${T.activity_logs} WHERE entity_type = 'user' AND entity_id IN (${ph})`, ids)
    await execute(`DELETE FROM ${T.activity_logs} WHERE actor_user_id IN (${ph})`, ids)
    await execute(`DELETE FROM ${T.users} WHERE id IN (${ph})`, ids)
  }
}

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)
await closePool()
process.exit(fail.length === 0 ? 0 : 1)
