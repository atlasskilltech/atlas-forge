/**
 * Exercises repositories and services against the real database.
 *
 *   npm run db:test
 *
 * Reads are asserted against the seeded data. Writes run inside a transaction
 * that is always rolled back, so the script never mutates the database.
 */
import { register } from 'node:module'
import { pathToFileURL } from 'node:url'

// Resolve the app's "@/..." alias and strip `server-only` so lib modules can be
// imported outside Next.js.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
  import { existsSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'
  const ROOT = ${JSON.stringify(pathToFileURL(process.cwd()).href)}

  // Next resolves "@/x" and extensionless imports; Node does neither, so the
  // loader reproduces both rules for these scripts.
  export async function resolve(specifier, context, next) {
    if (specifier === 'server-only') {
      return { url: 'data:text/javascript,', shortCircuit: true }
    }
    const base =
      specifier.startsWith('@/')
        ? new URL('src/' + specifier.slice(2), ROOT + '/').href
        : specifier.startsWith('.') && context.parentURL
          ? new URL(specifier, context.parentURL).href
          : null

    if (base) {
      for (const candidate of [base, base + '.js', base + '/index.js']) {
        if (existsSync(fileURLToPath(candidate))) return next(candidate, context)
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

const { pool, transaction, closePool } = await import('@/lib/db')
const lookups = await import('@/lib/services/lookups.service')
const students = await import('@/lib/services/students.service')
const startups = await import('@/lib/services/startups.service')
const listings = await import('@/lib/services/listings.service')
const applications = await import('@/lib/services/applications.service')
const concierge = await import('@/lib/services/concierge.service')
const mentorship = await import('@/lib/services/mentorship.service')
const incubation = await import('@/lib/services/incubation.service')
const platform = await import('@/lib/services/platform.service')
const auth = await import('@/lib/services/auth.service')
const usersRepo = await import('@/lib/repositories/users.repository')

console.log('\nATLAS Forge — data layer verification\n')

// ---- lookups --------------------------------------------------------------
const opts = await lookups.getFormOptions()
check('lookups.getFormOptions', opts.industries.length === 5 && opts.stages.length === 5,
  `${opts.industries.length} industries, ${opts.stages.length} stages, ${opts.skills.length} skills`)

const settings = await lookups.getSettingsMap()
check('settings cast to types', settings.v1_mode === true && settings.platform_name === 'ATLAS Forge',
  `v1_mode=${settings.v1_mode} (${typeof settings.v1_mode})`)

// ---- auth -----------------------------------------------------------------
const identity = await auth.authenticate('ATL-2022-0012', 'Atlas@2026')
check('auth.authenticate', identity.user.appId === 'ATL-2022-0012')
check('multi-role identity', identity.roles.length === 2,
  identity.roles.map((r) => r.slug).join(' + '))
check('permissions resolved', identity.permissions.length > 20,
  `${identity.permissions.length} permissions`)
check('auth rejects wrong password',
  await auth.authenticate('ATL-2022-0012', 'wrong').then(() => false).catch(() => true))

// ---- students -------------------------------------------------------------
const riya = await usersRepo.findByAppId('ATL-2024-0871')
const profile = await students.getProfile(riya.id)
check('students.getProfile', profile.programme === 'BDes Product Design' && profile.skills.length === 5,
  `${profile.skills.length} skills, available=${profile.isAvailable} (${typeof profile.isAvailable})`)
check('TINYINT mapped to real boolean', profile.isAvailable === true)

const pool_ = await students.getPool({})
const design = await students.getPool({ track: 'Design' })
// 7 students have profiles but Kavya Reddy is inactive — the founder-facing
// pool must not surface her.
check('student pool + skills (no N+1)', pool_.length === 6 && pool_[0].skills.length > 0,
  `${pool_.length} students`)
check('pool excludes inactive students',
  !pool_.some((s) => s.name === 'Kavya Reddy'))
check('pool filtered by track', design.length < pool_.length, `Design=${design.length}`)

// ---- startups -------------------------------------------------------------
const novamed = await startups.getWithTeam('novamed')
check('startups.getWithTeam', novamed.members.length === 3 && novamed.industry.name === 'HealthTech',
  `${novamed.members.length} members, mentor=${novamed.mentor?.name}`)

// ---- listings -------------------------------------------------------------
const live = await listings.listLive()
check('listings.listLive + skills', live.length === 3 && live.every((l) => Array.isArray(l.skills)),
  `${live.length} live`)

const queue = await listings.getApprovalQueue({})
const withFm = queue.filter((l) => l.forgeDecision)
check('approval queue exposes FM decision', withFm.length === 4,
  `${withFm.length} decided of ${queue.length}`)

// ---- applications ---------------------------------------------------------
const riyaApps = await applications.listForUser(riya.id)
check('applications.listForUser', riyaApps.length === 3, `${riyaApps.length} applications`)
const history = await applications.getHistory(riyaApps[0].id)
check('application history recorded', history.length >= 1, `${history.length} events`)

// ---- concierge ------------------------------------------------------------
const contacts = await concierge.listContacts({})
const cStats = await concierge.contactStats()
check('concierge.listContacts', contacts.length === 5, `${contacts.length} contacts`)
check('concierge stats aggregate', cStats.total === 5 && cStats.ongoing === 2,
  `total=${cStats.total} ongoing=${cStats.ongoing} done=${cStats.completed}`)

// ---- mentorship -----------------------------------------------------------
const mentors = await mentorship.listMentors()
const grouped = await mentorship.listMentorsGrouped()
// `>= 7` rather than `=== 7`: the alumni import adds seventy rows where it has
// been run. The three type groups hold regardless — alumni is one of them.
check('mentorship.listMentors + skills', mentors.length >= 7 && mentors[0].skills !== undefined &&
  grouped.length === 3,
  `${mentors.length} mentors, ${grouped.length} groups`)

// ---- incubation -----------------------------------------------------------
const apps = await incubation.listApplications({})
const readiness = await incubation.getReadiness(apps.find((a) => a.ideaName.startsWith('NovaMed')).id)
check('incubation readiness ring', readiness.percent === 100 && readiness.total === 4,
  `${readiness.complete}/${readiness.total} = ${readiness.percent}%`)

const partial = await incubation.getReadiness(apps.find((a) => a.ideaName.startsWith('GreenGrid')).id)
check('partial readiness computed', partial.percent === 50, `${partial.percent}%`)

// ---- platform -------------------------------------------------------------
const s = await platform.stats()
// 3 pending: Frontend Developer, Data Analyst and the student collab post.
check('platform.stats single round trip',
  s.total_users === 15 && s.active_startups === 2 && s.pending_listings === 3,
  `users=${s.total_users} startups=${s.active_startups} pending=${s.pending_listings}`)

const activity = await platform.listActivity({})
// 8 original rows plus the two added for Riya so the Student home screen has
// the three-entry activity panel the reference draws.
check('activity log + JSON column', activity.length === 10, `${activity.length} entries`)

const riyaActivity = await platform.listActivity({ actorId: riya.id, limit: 3 })
check('activity filtered by actor and limited', riyaActivity.length === 3,
  `${riyaActivity.length} for Riya`)

const notes = await platform.listNotifications(riya.id)
check('notifications', notes.length === 2, `${notes.length} for Riya`)

// ---- writes, rolled back --------------------------------------------------
let wrote = false
try {
  await transaction(async (tx) => {
    const { insert } = await import('@/lib/db')
    const id = await insert(
      'INSERT INTO listings (type, title, created_by, status) VALUES (?, ?, ?, ?)',
      ['job', '__probe__', riya.id, 'pending'],
      tx
    )
    wrote = id > 0
    throw new Error('rollback')
  })
} catch {
  /* expected */
}
const leaked = await pool.query("SELECT COUNT(*) AS n FROM listings WHERE title = '__probe__'")
check('transaction commits then rolls back cleanly', wrote && leaked[0][0].n === 0,
  `inserted=${wrote}, leaked=${leaked[0][0].n}`)

// ---- duplicate-key translation -------------------------------------------
const dupe = await applications
  .apply({ listingId: riyaApps[0].listing.id, applicantId: riya.id })
  .then(() => null)
  .catch((e) => e)
check('duplicate application → ConflictError',
  dupe?.constructor?.name === 'ConflictError' && dupe.status === 409,
  `${dupe?.constructor?.name} ${dupe?.status}`)

// ---- report ---------------------------------------------------------------
for (const line of pass) console.log(`  PASS  ${line}`)
for (const line of fail) console.log(`  FAIL  ${line}`)
console.log(`\n${pass.length} passed, ${fail.length} failed\n`)

await closePool()
process.exit(fail.length === 0 ? 0 : 1)
