/**
 * Exercises the Student module against the real database.
 *
 *   npm run test:student
 *
 * Reads are asserted against the seeded data. Every write runs against a
 * throwaway user created at the start and removed at the end, so the script
 * can be run repeatedly without drifting the demo data or leaving rows behind.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

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
const check = (name, ok, detail = '') =>
  (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

const { execute, queryOne, queryValue, closePool } = await import('@/lib/db')
const student = await import('@/lib/modules/student')
const present = await import('@/lib/modules/student/presenter')
const { hashPassword } = await import('@/lib/auth/password')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — Student module verification\n')

/* -------------------------------------------------------------------------- */
/* Reads, against the seeded student                                          */
/* -------------------------------------------------------------------------- */

const riya = await usersRepo.findByAppId('ATL-2024-0871')

const home = await student.getHome(riya.id)
check('getHome — profile from MySQL', home.profile.name === 'Riya Kapoor', home.profile.name)
check('getHome — year formatted', home.profile.year === '3rd Year', home.profile.year)
check(
  'getHome — 4 desktop stats, 3 mobile',
  home.stats.length === 4 && home.mobileStats.length === 3
)
check(
  'getHome — availability derived from TINYINT',
  home.stats[0].value === 'Active' && home.stats[0].tone === 'success'
)
check(
  'getHome — open applications exclude Not Selected',
  home.stats[1].value === '2',
  `${home.stats[1].value} of 3 total`
)
check(
  'getHome — projects exploring counts distinct startups',
  home.stats[2].value === '3',
  home.stats[2].value
)
check('getHome — activity rows present', home.activity.length === 3, `${home.activity.length} rows`)
check(
  'getHome — activity timestamps humanised',
  /^(Today|Yesterday|[A-Z][a-z]{2} \d+)/.test(home.activity[0].meta),
  home.activity[0].meta
)
check(
  'getHome — activity status mapped to chip tone',
  home.activity.every((row) => typeof row.tone === 'string' && typeof row.dot === 'string')
)

const profile = await student.getProfile(riya.id)
check('getProfile — skills from student_skills', profile.profile.skills.length === 5,
  profile.profile.skills.join(', '))
check('getProfile — mobile chip row is shorter', profile.profile.mobileSkills.length === 3)
check('getProfile — 4 stat cards', profile.stats.length === 4)
check(
  'getProfile — raw values kept separate from display copy',
  profile.profile.hoursPerWeek === '10 hrs/week' && profile.profile.raw.hoursPerWeek === 10
)

const jobs = await student.getJobs(riya.id)
check('getJobs — only live listings', jobs.jobs.length === 3, `${jobs.jobs.length} live`)
check(
  'getJobs — applied flag reflects real applications',
  jobs.jobs.some((job) => job.applied),
  jobs.jobs.filter((job) => job.applied).map((job) => job.title).join(', ') || 'none'
)
check(
  'getJobs — filters derive from listing types actually present',
  jobs.filters[0] === 'All' && jobs.filters.length === new Set(jobs.filters).size,
  jobs.filters.join(' | ')
)
check(
  'getJobs — card skills trimmed, detail keeps all',
  jobs.jobs.every((job) => job.skills.length <= 2 && job.detailSkills.length >= job.skills.length)
)

const applications = await student.getApplications(riya.id)
check('getApplications — 3 rows', applications.applications.length === 3)
check(
  'getApplications — status vocabulary translated',
  applications.applications.some((row) => row.status === 'Under Review'),
  applications.applications.map((row) => row.status).join(', ')
)
check(
  'getApplications — startup avatar tint carried through',
  applications.applications.every((row) => row.initial && row.tone)
)

const projects = await student.getProjects()
check('getProjects — active startups', projects.projects.length >= 2, `${projects.projects.length}`)
check(
  'getProjects — "New This Month" is answerable',
  projects.projects.every((project) => typeof project.isNew === 'boolean')
)
check(
  'getProjects — filters end with the two behavioural tabs',
  projects.filters.at(-2) === 'Actively Hiring' && projects.filters.at(-1) === 'New This Month',
  projects.filters.join(' | ')
)

const mentorship = await student.getMentorship(riya.id)
check('getMentorship — 2 sessions', mentorship.sessions.length === 2)
check(
  'getMentorship — unscheduled session reads as pending',
  mentorship.sessions.some((session) => session.when === 'Pending Assignment')
)
check(
  'getMentorship — scheduled session formatted',
  mentorship.sessions.some((session) => /^[A-Z][a-z]{2}, \d+ [A-Z][a-z]{2} · /.test(session.when)),
  mentorship.sessions.map((session) => session.when).join(' | ')
)
check(
  'getMentorship — mentor types carry slugs',
  mentorship.mentorTypes.length === 4 && mentorship.mentorTypes.at(-1).name === 'No preference'
)

const incubation = await student.getIncubation(riya.id)
check('getIncubation — 4 readiness items', incubation.readinessItems.length === 4)
check(
  'getIncubation — labels and hints come from the database',
  incubation.readinessItems[0].label === 'Pitch Deck or Concept Note' &&
    Boolean(incubation.readinessItems[0].hint)
)
check('getIncubation — stages from lookup', incubation.stages.length === 5)

const collab = await student.getCollabOptions()
check(
  'getCollabOptions — 3 engagement types, as drawn',
  collab.engagementTypes.length === 3,
  collab.engagementTypes.map((type) => type.name).join(' | ')
)

/* -------------------------------------------------------------------------- */
/* Writes, against a throwaway student                                        */
/* -------------------------------------------------------------------------- */

const APP_ID = 'ATL-TEST-0001'
let testUserId = null

/**
 * Several tables reference a user with ON DELETE RESTRICT, so everything the
 * test created is removed in dependency order before the user itself. Run both
 * before and after, so an earlier crashed run cannot block this one.
 */
const CLEANUP = [
  // Notifications this student's actions sent to *other* people — applying to
  // a listing notifies whoever posted it. Deleting only rows addressed to the
  // test student leaves those behind on seeded accounts.
  "DELETE FROM notifications WHERE entity_type = 'application' AND entity_id IN (SELECT id FROM applications WHERE applicant_user_id = ?)",
  "DELETE FROM notifications WHERE entity_type = 'listing' AND entity_id IN (SELECT id FROM listings WHERE created_by = ?)",
  'DELETE FROM application_events WHERE application_id IN (SELECT id FROM applications WHERE applicant_user_id = ?)',
  'DELETE FROM applications WHERE applicant_user_id = ?',
  'DELETE FROM mentorship_sessions WHERE mentee_user_id = ?',
  'DELETE FROM mentorship_requests WHERE requester_user_id = ?',
  'DELETE FROM application_readiness WHERE application_id IN (SELECT id FROM incubation_applications WHERE applicant_user_id = ?)',
  'DELETE FROM incubation_applications WHERE applicant_user_id = ?',
  'DELETE FROM listing_skills WHERE listing_id IN (SELECT id FROM listings WHERE created_by = ?)',
  'DELETE FROM applications WHERE listing_id IN (SELECT id FROM listings WHERE created_by = ?)',
  'DELETE FROM listings WHERE created_by = ?',
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
    name: 'Test Student',
    email: 'test.student@atlasuniversity.edu.in',
    passwordHash: await hashPassword('Atlas@2026'),
    initials: 'TS',
  })
  const studentRole = await queryOne('SELECT id FROM roles WHERE slug = ?', ['student'])
  await usersRepo.grantRole(testUserId, studentRole.id, { isPrimary: true })
  await usersRepo.upsertStudentProfile(testUserId, {
    programme: 'BTech Computer Science',
    yearOfStudy: 2,
    hoursPerWeek: 0,
    isAvailable: false,
  })

  // ---- availability -------------------------------------------------------
  await student.saveAvailability(testUserId, {
    isAvailable: true,
    hoursPerWeek: 12,
    workTypes: 'Engineering',
    timing: 'Weekends',
  })
  const afterAvailability = await student.getAvailability(testUserId)
  check(
    'saveAvailability — persisted and re-read',
    afterAvailability.profile.isAvailable === true &&
      afterAvailability.profile.hoursPerWeek === '12 hrs/week',
    afterAvailability.profile.concierge
  )

  const rejected = await student
    .saveAvailability(testUserId, { isAvailable: true, hoursPerWeek: 200 })
    .then(() => null)
    .catch((error) => error)
  check(
    'saveAvailability — rejects impossible hours',
    rejected?.constructor?.name === 'ValidationError',
    `${rejected?.constructor?.name} ${rejected?.status}`
  )

  // ---- skills -------------------------------------------------------------
  const catalogue = afterAvailability.allSkills
  await student.saveSkills(testUserId, [catalogue[0].id, catalogue[1].id])
  const afterSkills = await student.getAvailability(testUserId)
  check('saveSkills — replaces the whole set', afterSkills.profile.skills.length === 2,
    afterSkills.profile.skills.join(', '))

  const badSkill = await student
    .saveSkills(testUserId, [999999])
    .then(() => null)
    .catch((error) => error)
  check(
    'saveSkills — unknown skill id refused',
    badSkill?.constructor?.name === 'ValidationError'
  )

  // ---- profile ------------------------------------------------------------
  await student.saveProfile(testUserId, {
    name: 'Test Student Renamed',
    email: 'test.student@atlasuniversity.edu.in',
    bio: 'Second-year engineer.',
  })
  const renamed = await student.getProfile(testUserId)
  check('saveProfile — name written', renamed.profile.name === 'Test Student Renamed')

  const noName = await student
    .saveProfile(testUserId, { name: '  ', email: 'x@y.z' })
    .then(() => null)
    .catch((error) => error)
  check('saveProfile — blank name refused', noName?.constructor?.name === 'ValidationError')

  // ---- applying -----------------------------------------------------------
  const liveJobs = await student.getJobs(testUserId)
  const target = liveJobs.jobs[0]
  const { applicationId } = await student.applyToListing(testUserId, target.listingId)
  check('applyToListing — application created', applicationId > 0, `id ${applicationId}`)

  const afterApply = await student.getJobs(testUserId)
  check(
    'applyToListing — job now shows as applied',
    afterApply.jobs.find((job) => job.id === target.id)?.applied === true
  )

  const eventCount = await queryValue(
    'SELECT COUNT(*) FROM application_events WHERE application_id = ?',
    [applicationId]
  )
  check('applyToListing — history event recorded', Number(eventCount) === 1, `${eventCount} event`)

  const logged = await queryValue(
    "SELECT COUNT(*) FROM activity_logs WHERE actor_user_id = ? AND module = 'Hiring'",
    [testUserId]
  )
  check('applyToListing — written to the audit trail', Number(logged) === 1)

  const duplicate = await student
    .applyToListing(testUserId, target.listingId)
    .then(() => null)
    .catch((error) => error)
  check(
    'applyToListing — applying twice is a 409',
    duplicate?.constructor?.name === 'ConflictError' && duplicate.status === 409
  )

  const notANumber = await student
    .applyToListing(testUserId, 'abc')
    .then(() => null)
    .catch((error) => error)
  check('applyToListing — non-numeric id refused', notANumber?.constructor?.name === 'ValidationError')

  // A student must not be able to withdraw somebody else's application.
  const riyaApplications = await student.getApplications(riya.id)
  const foreign = await student
    .withdrawApplication(testUserId, riyaApplications.applications[0].applicationId)
    .then(() => null)
    .catch((error) => error)
  check(
    "withdrawApplication — another student's application is 404",
    foreign?.constructor?.name === 'NotFoundError' && foreign.status === 404
  )

  await student.withdrawApplication(testUserId, applicationId)
  const withdrawn = await queryValue('SELECT status FROM applications WHERE id = ?', [applicationId])
  check('withdrawApplication — own application withdrawn', withdrawn === 'withdrawn', withdrawn)

  // ---- mentorship ---------------------------------------------------------
  const { requestId } = await student.requestMentorship(testUserId, {
    topic: 'Choosing a backend stack',
    context: 'Building a campus marketplace.',
    mentorType: 'faculty',
    timing: 'Weekday evenings',
  })
  check('requestMentorship — request created', requestId > 0)

  const sessions = await student.getMentorship(testUserId)
  check(
    'requestMentorship — placeholder session appears immediately',
    sessions.sessions.some(
      (session) => session.when === 'Pending Assignment' && session.mentor === 'Mentor: TBD'
    ),
    sessions.sessions.map((session) => `${session.status}`).join(', ')
  )

  const noTopic = await student
    .requestMentorship(testUserId, { topic: '   ' })
    .then(() => null)
    .catch((error) => error)
  check('requestMentorship — blank topic refused', noTopic?.constructor?.name === 'ValidationError')

  // ---- collab post --------------------------------------------------------
  const posted = await student.postCollab(testUserId, {
    title: 'Looking for a Figma partner',
    summary: 'Redesigning the campus events app.',
    collaborator: 'Designer',
    skills: 'Figma, Branding, Telepathy',
    engagement: 'no-pay',
  })
  const postedRow = await queryOne('SELECT type, status, title FROM listings WHERE id = ?', [
    posted.listingId,
  ])
  check(
    'postCollab — stored as a collab awaiting approval',
    postedRow.type === 'collab' && postedRow.status === 'pending',
    `${postedRow.type}/${postedRow.status}`
  )
  check(
    'postCollab — known skills attached, unknown reported not dropped silently',
    posted.unmatchedSkills.join(',') === 'Telepathy',
    `unmatched: ${posted.unmatchedSkills.join(', ') || 'none'}`
  )
  const attached = await queryValue('SELECT COUNT(*) FROM listing_skills WHERE listing_id = ?', [
    posted.listingId,
  ])
  check('postCollab — 2 recognised skills linked', Number(attached) === 2, `${attached} linked`)

  // ---- incubation ---------------------------------------------------------
  const submission = await student.submitIncubation(testUserId, {
    ideaName: 'CampusKart',
    problem: 'Students cannot resell course kit easily.',
    stage: 'idea',
    readiness: { 'pitch-deck': 'https://example.com/deck', demo: 'https://example.com/demo' },
  })
  const stored = await queryOne(
    'SELECT status, completion_pct FROM incubation_applications WHERE id = ?',
    [submission.applicationId]
  )
  check(
    'submitIncubation — percentage recomputed server-side from the evidence',
    stored.status === 'pending' && Number(stored.completion_pct) === 50,
    `${stored.completion_pct}% from 2 of 4 items`
  )

  const noIdea = await student
    .submitIncubation(testUserId, { ideaName: '' })
    .then(() => null)
    .catch((error) => error)
  check('submitIncubation — blank idea name refused', noIdea?.constructor?.name === 'ValidationError')
} finally {
  if (testUserId) {
    await purge(testUserId)
    const leaked = await queryValue('SELECT COUNT(*) FROM users WHERE app_id = ?', [APP_ID])
    check('cleanup — test student removed', Number(leaked) === 0)
  }
}

/* -------------------------------------------------------------------------- */
/* Presenter, as pure functions                                               */
/* -------------------------------------------------------------------------- */

check(
  'presenter — unavailable student is told they are hidden',
  present
    .toProfile({ name: 'X', skills: [], isAvailable: false, hoursPerWeek: null })
    .concierge.startsWith('You are hidden')
)
check(
  'presenter — unknown application status does not crash',
  present.toApplication({ id: 1, status: 'nonsense', listing: {}, appliedAt: null }).status === '—'
)
check(
  'presenter — singular and plural session labels',
  present.toHomeStats({ openApplications: 0, projectsExploring: 0, upcomingSessions: 2, isAvailable: false })[3]
    .label === 'Mentorship Sessions'
)

/* -------------------------------------------------------------------------- */

for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

await closePool()
process.exit(fail.length === 0 ? 0 : 1)
