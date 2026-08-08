/**
 * Exercises the Founder module against the real database.
 *
 *   npm run test:founder
 *
 * Reads are asserted against the seeded data. Writes run against a throwaway
 * founder created at the start and removed at the end, so the script can be
 * run repeatedly without drifting the demo data.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

register(
  'data:text/javascript,' +
    encodeURIComponent(`
  import { statSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'
  const ROOT = ${JSON.stringify(pathToFileURL(process.cwd()).href)}

  const isFile = (url) => {
    try { return statSync(fileURLToPath(url)).isFile() } catch { return false }
  }

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
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

const { execute, query, queryOne, queryValue, closePool } = await import('@/lib/db')
const founder = await import('@/lib/modules/founder')
const present = await import('@/lib/modules/founder/presenter')
const { hashPassword } = await import('@/lib/auth/password')
const usersRepo = await import('@/lib/repositories/users.repository')
const applicationsService = await import('@/lib/services/applications.service')
const studentModule = await import('@/lib/modules/student')

const VALID_PIPELINE = [
  'applied',
  'under_review',
  'shortlisted',
  'interview',
  'selected',
  'not_selected',
  'withdrawn',
]

console.log('\nATLAS Forge — Founder module verification\n')

/* -------------------------------------------------------------------------- */
/* Reads, against the seeded founder                                          */
/* -------------------------------------------------------------------------- */

const shantanu = await usersRepo.findByAppId('ATL-2022-0012')

const context = await founder.getContext(shantanu)
check('getContext — owned startup resolved', context.startup?.name === 'NovaMed', context.startup?.name)
check('getContext — founder access grant detected', context.hasGrant === true)

const home = await founder.getHome(shantanu)
check('getHome — 5 desktop stats, 3 mobile',
  home.stats.length === 5 && home.mobileStats.length === 3)
check('getHome — startup name is the first counter', home.stats[0].value === 'NovaMed')
check('getHome — open roles counts live listings only', home.stats[1].value === '2',
  `${home.stats[1].value} live of 3 posted`)
check('getHome — student contacts scoped to this founder', home.stats[2].value === '3',
  `${home.stats[2].value} of 5 platform-wide`)
check('getHome — incubation status from the startup row',
  home.stats[4].value === 'Active' && home.stats[4].tone === 'success')
check('getHome — team size on mobile', home.mobileStats[0].value === '3', home.mobileStats[0].value)
check('getHome — stage on mobile', home.mobileStats[2].value === 'Early Traction',
  home.mobileStats[2].value)
check('getHome — dated chip rendered', /^[A-Z][a-z]{2}, \d+ \w+ \d{4}$/.test(home.date), home.date)

// The feed must include other people's actions on this startup, not just the
// founder's own — that is the whole point of it.
const actors = new Set(home.mobileActivity.map((row) => row.initials))
check('getHome — feed includes actions by others', actors.size > 1, [...actors].join(', '))
check('getHome — feed rows carry an avatar tone',
  home.mobileActivity.every((row) => Boolean(row.tone)))
check('getHome — desktop and mobile feeds are the same rows',
  home.activity.length === home.mobileActivity.length)

const profile = await founder.getProfile(shantanu)
check('getProfile — badge reflects the real grant',
  profile.profile.badge === 'Founder Unlocked', profile.profile.badge)
check('getProfile — startup name shown', profile.profile.startup === 'NovaMed')

const concierge = await founder.getConcierge(shantanu)
check('getConcierge — pool excludes inactive students', concierge.students.length === 6,
  `${concierge.students.length} students`)
check('getConcierge — track filters derived from real skill categories',
  concierge.filters[0] === 'All' && concierge.filters.at(-1) === 'Available Now',
  concierge.filters.join(' | '))
const riya = concierge.students.find((student) => student.name === 'Riya Kapoor')
check('getConcierge — student meta assembled', riya?.detailMeta === 'BDes Product Design · 3rd Year · ATL-2024-0871',
  riya?.detailMeta)
check('getConcierge — track record counted from contracts',
  riya?.stats[2].value === '1' && riya?.stats[1].value === '10 hrs',
  riya?.stats.map((stat) => `${stat.value} ${stat.label}`).join(', '))
check('getConcierge — recent outreach attached', concierge.contactLog.length === 2)

const log = await founder.getContactLog(shantanu)
check('getContactLog — only this founder’s contacts', log.contacts.length === 3,
  `${log.contacts.length} of 5 platform-wide`)
check('getContactLog — Forge Manager recorded as CC’d',
  log.contacts.every((row) => row.ccd === 'Mihir Pawar'))
check('getContactLog — status vocabulary translated',
  log.contacts.some((row) => row.status === 'Pending'),
  log.contacts.map((row) => row.status).join(', '))

const projects = await founder.getProjects(shantanu)
check('getProjects — own startup flagged',
  projects.projects.filter((project) => project.mine).length === 1,
  projects.projects.find((project) => project.mine)?.name)
check('getProjects — featured comes from the database, not from ownership',
  projects.projects.some((project) => project.featured))

const startup = await founder.getStartup(shantanu)
check('getStartup — team from startup_members', startup.startup.team.length === 3,
  startup.startup.team.map((member) => member.role).join(', '))
check('getStartup — two-letter monogram', startup.startup.initial === 'NO', startup.startup.initial)
check('getStartup — hiring adds its own tag',
  startup.startup.tags.includes('Actively Hiring'), startup.startup.tags.join(' | '))
check('getStartup — short names for the mobile cards',
  startup.startup.team.some((member) => member.shortName === 'Shantanu G.'),
  startup.startup.team.map((member) => member.shortName).join(', '))

const hiring = await founder.getHiring(shantanu)
check('getHiring — 4 tabs', hiring.tabs.length === 4, hiring.tabs.join(' | '))
check('getHiring — My Listings is scoped to this founder',
  hiring.listingsByTab['My Listings'].length === 3,
  `${hiring.listingsByTab['My Listings'].length} listings`)
check('getHiring — Browse All Roles is live jobs only',
  hiring.listingsByTab['Browse All Roles'].every((listing) => listing.status === 'Live'))
check('getHiring — Collabs tab separates collab posts',
  hiring.listingsByTab.Collabs.every((listing) => listing.type === 'Collab / No Pay'),
  `${hiring.listingsByTab.Collabs.length} collabs`)
check('getHiring — rejected listing surfaced to its author',
  hiring.listingsByTab['My Listings'].some((listing) => listing.status === 'Rejected'))
check('getHiring — mobile status abbreviated',
  hiring.listingsByTab['My Listings'].every((listing) => listing.shortStatus.length <= listing.status.length))

const withApplicants = Object.values(hiring.applicantsByListing).flat()
check('getHiring — applicants attached to own listings', withApplicants.length > 0,
  `${withApplicants.length} applicants`)

const applicants = await founder.getApplicants(shantanu)
check('getApplicants — one entry per own listing', applicants.listings.length === 3)

const mentorship = await founder.getMentorship(shantanu)
check('getMentorship — sessions for this founder', mentorship.sessions.length === 2,
  mentorship.sessions.map((session) => session.status).join(', '))
check('getMentorship — mentor resolved', mentorship.mentor?.name === 'Mihir Pawar')
check('getMentorship — upcoming card names the startup',
  mentorship.upcoming?.title === 'Startup Review — NovaMed', mentorship.upcoming?.title)

const incubation = await founder.getIncubation(shantanu)
check('getIncubation — application summarised',
  incubation.draft?.title?.includes('NovaMed') && incubation.draft.title.includes('Approved'),
  incubation.draft?.title)

const form = await founder.getStartupForm(shantanu)
check('getStartupForm — prefilled from the stored startup',
  form.values.name === 'NovaMed' && form.values.industrySlug === 'healthtech',
  `${form.values.name} / ${form.values.industrySlug}`)
check('getStartupForm — readiness prefilled from the application',
  Object.values(form.values.readiness).filter(Boolean).length === 4,
  `${Object.values(form.values.readiness).filter(Boolean).length} of 4 filled`)
check('getStartupForm — lookups supplied', form.industries.length === 5 && form.stages.length === 5)

const jobOptions = await founder.getJobFormOptions()
check('getJobFormOptions — contract and listing types', jobOptions.contractTypes.length === 4 &&
  jobOptions.listingTypes.length === 5)

const needs = await founder.getPostedNeeds(shantanu)
check('getPostedNeeds — scoped to this founder', needs.needs.length === 1,
  `${needs.needs.length} of 3 platform-wide`)

/* -------------------------------------------------------------------------- */
/* The hiring pipeline, as rules                                              */
/* -------------------------------------------------------------------------- */

const { canTransition, nextStatuses } = applicationsService

check('pipeline — the happy path is walkable step by step',
  ['applied', 'under_review', 'shortlisted', 'interview', 'selected']
    .every((status, index, all) => index === 0 || canTransition(all[index - 1], status)))
check('pipeline — a stage may be skipped forwards',
  canTransition('applied', 'interview') && canTransition('under_review', 'selected'))
check('pipeline — it cannot run backwards',
  !canTransition('interview', 'shortlisted') && !canTransition('selected', 'interview'))
check('pipeline — a rejected application cannot rejoin the queue',
  !canTransition('not_selected', 'under_review') && !canTransition('not_selected', 'applied'))
check('pipeline — a withdrawn application cannot be revived',
  !canTransition('withdrawn', 'applied') && !canTransition('withdrawn', 'selected'))
check('pipeline — a decided application cannot be re-decided',
  !canTransition('selected', 'not_selected') && !canTransition('not_selected', 'selected'))
check('pipeline — a founder may decline from any live stage',
  ['applied', 'under_review', 'shortlisted', 'interview']
    .every((status) => canTransition(status, 'not_selected')))
check('pipeline — no status transitions to itself',
  VALID_PIPELINE.every((status) => !canTransition(status, status)))
check('pipeline — an unknown status is refused',
  !canTransition('applied', 'hired') && !canTransition('applied', ''))
check('pipeline — the choices offered from Applied',
  nextStatuses('applied').join(', ') ===
    'under_review, shortlisted, interview, selected, not_selected, withdrawn',
  nextStatuses('applied').join(', '))
check('pipeline — a terminal status offers nothing',
  nextStatuses('selected').length === 0 && nextStatuses('not_selected').length === 0)

/* -------------------------------------------------------------------------- */
/* Writes, against a throwaway founder                                        */
/* -------------------------------------------------------------------------- */

const APP_ID = 'ATL-TEST-0002'
let testUserId = null

const CLEANUP = [
  // Notifications the test founder's actions sent to *other* people. Deleting
  // only rows addressed to the test user leaves these behind on seeded
  // accounts, which then fail the data-layer counts on the next run.
  "DELETE FROM notifications WHERE entity_type = 'concierge_contact' AND entity_id IN (SELECT id FROM concierge_contacts WHERE founder_user_id = ?)",
  "DELETE FROM notifications WHERE entity_type = 'listing' AND entity_id IN (SELECT id FROM listings WHERE created_by = ?)",
  "DELETE FROM notifications WHERE entity_type = 'application' AND entity_id IN (SELECT ap.id FROM applications ap JOIN listings l ON l.id = ap.listing_id WHERE l.created_by = ?)",
  // Audit rows for applications to this founder's listings. Their actor is the
  // *applicant*, so deleting by `actor_user_id = testUser` misses them.
  "DELETE FROM activity_logs WHERE entity_type = 'application' AND entity_id IN (SELECT ap.id FROM applications ap JOIN listings l ON l.id = ap.listing_id WHERE l.created_by = ?)",
  'DELETE FROM application_events WHERE application_id IN (SELECT id FROM applications WHERE applicant_user_id = ?)',
  'DELETE FROM applications WHERE applicant_user_id = ?',
  'DELETE FROM applications WHERE listing_id IN (SELECT id FROM listings WHERE created_by = ?)',
  'DELETE FROM mentorship_sessions WHERE mentee_user_id = ?',
  'DELETE FROM mentorship_requests WHERE requester_user_id = ?',
  'DELETE FROM application_readiness WHERE application_id IN (SELECT id FROM incubation_applications WHERE applicant_user_id = ?)',
  'DELETE FROM incubation_applications WHERE applicant_user_id = ?',
  'DELETE FROM listing_skills WHERE listing_id IN (SELECT id FROM listings WHERE created_by = ?)',
  'DELETE FROM listings WHERE created_by = ?',
  'DELETE FROM concierge_contacts WHERE founder_user_id = ?',
  'DELETE FROM posted_needs WHERE founder_user_id = ?',
  'DELETE FROM contracts WHERE founder_user_id = ?',
  'DELETE FROM startup_members WHERE startup_id IN (SELECT id FROM startups WHERE owner_user_id = ?)',
  'DELETE FROM startup_members WHERE user_id = ?',
  'DELETE FROM startups WHERE owner_user_id = ?',
  'DELETE FROM notifications WHERE user_id = ?',
  'DELETE FROM activity_logs WHERE actor_user_id = ?',
  'DELETE FROM student_skills WHERE user_id = ?',
  'DELETE FROM student_profiles WHERE user_id = ?',
  'DELETE FROM user_roles WHERE user_id = ?',
  'DELETE FROM users WHERE id = ?',
]

async function purge(userId) {
  for (const statement of CLEANUP) await execute(statement, [userId])
}

try {
  const existing = await usersRepo.findByAppId(APP_ID)
  if (existing) await purge(existing.id)

  testUserId = await usersRepo.create({
    appId: APP_ID,
    name: 'Test Founder',
    email: 'test.founder@atlasuniversity.edu.in',
    passwordHash: await hashPassword('Atlas@2026'),
    initials: 'TF',
  })
  const founderRole = await queryOne('SELECT id FROM roles WHERE slug = ?', ['founder'])
  await usersRepo.grantRole(testUserId, founderRole.id, { isPrimary: true })

  const testUser = await usersRepo.findById(testUserId)

  // ---- a founder with no startup yet --------------------------------------
  const emptyContext = await founder.getContext(testUser)
  check('a founder without a startup is a valid state',
    emptyContext.startup === null && emptyContext.hasGrant === false)

  const emptyHome = await founder.getHome(testUser)
  check('home renders for a founder with no startup',
    emptyHome.stats[0].value === '—' && emptyHome.stats[1].value === '0',
    emptyHome.stats.map((stat) => stat.value).join(' | '))

  const emptyStartup = await founder.getStartup(testUser)
  check('startup page reports nothing to show', emptyStartup.startup === null)

  // ---- creating the startup ----------------------------------------------
  const created = await founder.saveStartupProfile(testUser, {
    name: 'Test Ventures',
    tagline: 'Testing the founder flow end to end.',
    problemStatement: 'Nobody verifies their own seed data.',
    industrySlug: 'fintech',
    stageSlug: 'prototype',
    isHiring: true,
    openRoles: 2,
  })
  check('saveStartupProfile — creates when there is no startup', created.created === true)

  const createdRow = await queryOne('SELECT slug, status, open_roles FROM startups WHERE id = ?', [
    created.startupId,
  ])
  check('new startup gets a slug from its name', createdRow.slug === 'test-ventures', createdRow.slug)
  check('new startup starts pending, not live', createdRow.status === 'pending', createdRow.status)
  check('open roles stored as a number', Number(createdRow.open_roles) === 2)

  const ownerIsMember = await queryValue(
    'SELECT COUNT(*) FROM startup_members WHERE startup_id = ? AND user_id = ?',
    [created.startupId, testUserId]
  )
  check('the owner is added to the team', Number(ownerIsMember) === 1)

  // ---- updating it --------------------------------------------------------
  const updated = await founder.saveStartupProfile(await usersRepo.findById(testUserId), {
    name: 'Test Ventures',
    tagline: 'Now with a better tagline.',
    industrySlug: 'fintech',
    stageSlug: 'early-traction',
    isHiring: false,
    openRoles: 0,
  })
  check('saveStartupProfile — updates once one exists', updated.created === false)

  const afterUpdate = await queryOne('SELECT tagline, is_hiring, stage_id FROM startups WHERE id = ?', [
    created.startupId,
  ])
  check('the update landed', afterUpdate.tagline === 'Now with a better tagline.' &&
    Number(afterUpdate.is_hiring) === 0)

  const badRoles = await founder
    .saveStartupProfile(await usersRepo.findById(testUserId), { name: 'X', openRoles: 'many' })
    .then(() => null)
    .catch((error) => error)
  check('open roles must be a number', badRoles?.constructor?.name === 'ValidationError')

  // ---- posting a job ------------------------------------------------------
  const testUserWithStartup = await usersRepo.findById(testUserId)
  const { listingId } = await founder.postJob(testUserWithStartup, {
    title: 'Test Engineer',
    description: 'Write the tests nobody else writes.',
    roleType: 'Part-time',
    contractType: 'paid-freelance',
    compensation: 'Paid · ₹10,000/month',
    skills: 'Testing, React, Telepathy',
  })
  const listingRow = await queryOne(
    'SELECT type, status, startup_id, listing_type_id FROM listings WHERE id = ?',
    [listingId]
  )
  check('postJob — created as a job awaiting approval',
    listingRow.type === 'job' && listingRow.status === 'pending',
    `${listingRow.type}/${listingRow.status}`)
  check('postJob — attached to the founder’s own startup',
    Number(listingRow.startup_id) === created.startupId)
  check('postJob — free-typed role type matched to its lookup row',
    listingRow.listing_type_id !== null)

  const linkedSkills = await queryValue('SELECT COUNT(*) FROM listing_skills WHERE listing_id = ?', [
    listingId,
  ])
  check('postJob — recognised skills linked, unknown ignored', Number(linkedSkills) === 2,
    `${linkedSkills} of 3 typed`)

  const noTitle = await founder
    .postJob(testUserWithStartup, { title: '  ' })
    .then(() => null)
    .catch((error) => error)
  check('postJob — blank title refused', noTitle?.constructor?.name === 'ValidationError')

  // ---- moving an applicant through the pipeline ---------------------------
  // Riya applies to the test founder's own listing, so the ownership check is
  // exercised against a listing this founder really posted.
  const riyaUser = await usersRepo.findByAppId('ATL-2024-0871')

  // The listing was posted as `pending` because job listings require approval;
  // a student cannot apply to one. Approving it through the Forge Manager is a
  // different module's flow, so the fixture puts it live directly.
  await execute("UPDATE listings SET status = 'live' WHERE id = ?", [listingId])

  const pipelineApplicationId = await applicationsService.apply({
    listingId,
    applicantId: riyaUser.id,
  })

  const asApplied = await queryValue('SELECT status FROM applications WHERE id = ?', [
    pipelineApplicationId,
  ])
  check('an application starts as Applied', asApplied === 'applied', asApplied)

  for (const step of ['under_review', 'shortlisted', 'interview', 'selected']) {
    await founder.decideApplicant(testUserWithStartup, {
      applicationId: pipelineApplicationId,
      status: step,
    })
  }

  const finalStatus = await queryValue('SELECT status FROM applications WHERE id = ?', [
    pipelineApplicationId,
  ])
  check('decideApplicant — the full pipeline reaches Selected', finalStatus === 'selected',
    finalStatus)

  const history = await query(
    'SELECT from_status, to_status FROM application_events WHERE application_id = ? ORDER BY id',
    [pipelineApplicationId]
  )
  check('every transition is written to the append-only history',
    history.length === 5, `${history.length} events`)
  check('and each records where it came from',
    history.map((row) => row.to_status).join(' → ') ===
      'applied → under_review → shortlisted → interview → selected',
    history.map((row) => row.to_status).join(' → '))

  const auditRows = await queryValue(
    "SELECT COUNT(*) FROM activity_logs WHERE entity_type = 'application' AND entity_id = ?",
    [pipelineApplicationId]
  )
  // One row for the application itself, then one per transition.
  check('the managers can see the transitions on the platform trail',
    Number(auditRows) === 5, `${auditRows} audit rows: 1 apply + 4 transitions`)

  const studentNotified = await queryValue(
    "SELECT COUNT(*) FROM notifications WHERE entity_type = 'application' AND entity_id = ?",
    [pipelineApplicationId]
  )
  check('and the student is notified at each step', Number(studentNotified) === 5,
    `${studentNotified} notifications (1 on apply + 4 transitions)`)

  const backwards = await founder
    .decideApplicant(testUserWithStartup, {
      applicationId: pipelineApplicationId,
      status: 'interview',
    })
    .then(() => null)
    .catch((error) => error)
  check('decideApplicant — a decided application cannot be reopened',
    backwards?.constructor?.name === 'ConflictError' && backwards.status === 409,
    `${backwards?.constructor?.name} ${backwards?.status}`)

  const withdrawnByFounder = await founder
    .decideApplicant(testUserWithStartup, {
      applicationId: pipelineApplicationId,
      status: 'withdrawn',
    })
    .then(() => null)
    .catch((error) => error)
  check('decideApplicant — a founder cannot withdraw on the student’s behalf',
    withdrawnByFounder?.constructor?.name === 'ValidationError')

  const unknownStatus = await founder
    .decideApplicant(testUserWithStartup, { applicationId: pipelineApplicationId, status: 'hired' })
    .then(() => null)
    .catch((error) => error)
  check('decideApplicant — an unknown status is refused',
    unknownStatus?.constructor?.name === 'ValidationError')

  // Somebody else's listing must be invisible, not merely forbidden.
  const shantanu = await usersRepo.findByAppId('ATL-2022-0012')
  const theirApplications = await applicationsService.listForUser(riyaUser.id)
  const foreign = theirApplications.find((row) => row.id !== pipelineApplicationId)
  const foreignAttempt = await founder
    .decideApplicant(testUserWithStartup, {
      applicationId: foreign.id,
      status: 'under_review',
    })
    .then(() => null)
    .catch((error) => error)
  check('decideApplicant — another founder’s applicant is 404, not 403',
    foreignAttempt?.constructor?.name === 'NotFoundError' && foreignAttempt.status === 404,
    `${foreignAttempt?.constructor?.name} ${foreignAttempt?.status}`)

  // The student's own view must show the outcome.
  const studentView = await studentModule.getApplications(riyaUser.id)
  const shown = studentView.applications.find(
    (row) => row.applicationId === pipelineApplicationId
  )
  check('the student sees the outcome on My Applications', shown?.status === 'Selected',
    shown?.status)
  check('and a decided application no longer counts as active',
    (await studentModule.getHome(riyaUser.id)).stats[1].value === '2',
    (await studentModule.getHome(riyaUser.id)).stats[1].value)

  // ---- contacting a student ----------------------------------------------
  const { contactId } = await founder.contactStudent(testUserWithStartup, {
    studentId: (await usersRepo.findByAppId('ATL-2024-0871')).id,
    context: 'Design review for the test suite',
    duration: '2 weeks',
  })
  const contactRow = await queryOne(
    'SELECT cc_user_id, startup_id, status FROM concierge_contacts WHERE id = ?',
    [contactId]
  )
  check('contactStudent — the Forge Manager is CC’d automatically',
    contactRow.cc_user_id !== null)
  check('contactStudent — recorded against the founder’s startup',
    Number(contactRow.startup_id) === created.startupId)

  const notified = await queryValue(
    "SELECT COUNT(*) FROM notifications WHERE entity_type = 'concierge_contact' AND entity_id = ?",
    [contactId]
  )
  check('contactStudent — the student is notified', Number(notified) === 1)

  const noStudent = await founder
    .contactStudent(testUserWithStartup, { studentId: 'abc' })
    .then(() => null)
    .catch((error) => error)
  check('contactStudent — a non-numeric student id is refused',
    noStudent?.constructor?.name === 'ValidationError')

  const ownLog = await founder.getContactLog(testUserWithStartup)
  check('the new contact appears in this founder’s log only', ownLog.contacts.length === 1)

  // ---- mentorship ---------------------------------------------------------
  const { requestId } = await founder.requestMentorship(testUserWithStartup, {
    topic: 'Scaling the test suite',
    mentorType: 'industry',
    timing: 'Friday mornings',
  })
  const requestRow = await queryOne('SELECT startup_id FROM mentorship_requests WHERE id = ?', [
    requestId,
  ])
  check('requestMentorship — filed against the startup',
    Number(requestRow.startup_id) === created.startupId)

  // ---- profile ------------------------------------------------------------
  await founder.saveProfile(testUserWithStartup, {
    name: 'Test Founder Renamed',
    email: 'test.founder@atlasuniversity.edu.in',
    bio: 'Runs the founder test suite.',
  })
  const renamed = await usersRepo.findById(testUserId)
  check('saveProfile — name written', renamed.name === 'Test Founder Renamed')

  // ---- isolation between founders ----------------------------------------
  const otherHiring = await founder.getHiring(renamed)
  check('one founder never sees another’s listings under My Listings',
    otherHiring.listingsByTab['My Listings'].every((listing) => listing.title === 'Test Engineer'),
    otherHiring.listingsByTab['My Listings'].map((listing) => listing.title).join(', '))

  const otherApplicants = await founder.getApplicants(renamed)
  const visibleApplicants = otherApplicants.listings.flatMap((listing) => listing.applicants)
  check('and sees only the applicant to their own listing',
    visibleApplicants.length === 1 && visibleApplicants[0].name === 'Riya Kapoor',
    visibleApplicants.map((row) => row.name).join(', ') || 'none')
} finally {
  if (testUserId) {
    await purge(testUserId)
    const leaked = await queryValue('SELECT COUNT(*) FROM users WHERE app_id = ?', [APP_ID])
    check('cleanup — test founder removed', Number(leaked) === 0)
  }
}

/* -------------------------------------------------------------------------- */
/* Presenter, as pure functions                                               */
/* -------------------------------------------------------------------------- */

check('presenter — a founder without a grant gets the plain badge',
  present.toProfile({ id: 1, name: 'A B', initials: 'AB', appId: 'X', email: 'a@b.c' }, null, false)
    .badge === 'Founder')
check('presenter — unknown listing status does not crash',
  present.toListing({ id: 1, status: 'nonsense', skills: [] }).status === '—')
check('presenter — single-word names survive the short-name split',
  present.toMyStartup(
    { id: 1, name: 'X', status: 'active', isHiring: false },
    [{ id: 1, name: 'Prince', initials: 'P', roleTitle: 'Founder' }]
  ).team[0].shortName === 'Prince')

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

await closePool()
process.exit(fail.length === 0 ? 0 : 1)
