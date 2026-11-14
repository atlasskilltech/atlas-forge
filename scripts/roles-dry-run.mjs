/**
 * READ-ONLY dry run for migration 015 (one user = one role).
 *
 *   npm run db:roles:dryrun
 *
 * Prints exactly what migration 015 WOULD do, without changing anything:
 *   - how many users hold each role now, and after the migration;
 *   - every user whose roles would change, and which roles they would lose;
 *   - users with no role (they become Job Seekers) — normally the seeded mentors;
 *   - what happens to the network-member role;
 *   - pending registrations the new rules would refuse to approve;
 *   - existing staff accounts whose email is not @atlasuniversity.edu.in.
 *
 * Safety: it opens a READ ONLY transaction and only runs SELECTs, then rolls
 * back. It never writes. The rules below mirror the SQL in
 * database/migrations/015_one_role_per_user.sql exactly.
 */
import mysql from 'mysql2/promise'
import { dbEnv, describe } from './lib/forge-db.mjs'

const PRIORITY = ['super-admin', 'backend-manager', 'forge-manager', 'founder', 'student']
const LABEL = {
  'super-admin': 'Super Admin',
  'backend-manager': 'Backend Manager',
  'forge-manager': 'Forge Manager',
  founder: 'Founder',
  student: 'Job Seeker',
  'network-member': 'Network Member',
}
const STAFF = ['super-admin', 'backend-manager', 'forge-manager']
const ATLAS = '@atlasuniversity.edu.in'
const label = (slug) => LABEL[slug] ?? slug
const isAtlas = (email) => String(email ?? '').trim().toLowerCase().endsWith(ATLAS)

/** Same rule as the migration: highest known role, network-member/none → student. */
function targetOf(slugs) {
  return PRIORITY.find((slug) => slugs.includes(slug)) ?? 'student'
}

const cfg = dbEnv()
console.log(`\nDRY RUN (read-only) for migration 015 on ${describe(cfg)}\n`)

const conn = await mysql.createConnection(cfg)
try {
  await conn.query('START TRANSACTION READ ONLY')

  const [[{ version }]] = await conn.query('SELECT VERSION() AS version')
  const [[applied]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles'
        AND INDEX_NAME = 'uq_user_roles_one_active'`
  )
  const [[appIdCol]] = await conn.query(
    `SELECT CHARACTER_MAXIMUM_LENGTH AS len FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_users' AND COLUMN_NAME = 'app_id'`
  )
  console.log(`Server: ${version}`)
  console.log(`Migration 015 constraint already present: ${applied.n > 0 ? 'YES (re-running is a no-op)' : 'no'}`)
  console.log(`forge_users.app_id length: ${appIdCol?.len} → ${appIdCol?.len < 64 ? '64 (will be widened)' : 'unchanged'}\n`)

  const [users] = await conn.query(
    `SELECT u.id, u.app_id, u.full_name, u.email, u.status, u.deleted_at,
            (SELECT GROUP_CONCAT(r.slug ORDER BY r.sort_order) FROM forge_user_roles ur
               JOIN forge_roles r ON r.id = ur.role_id
              WHERE ur.user_id = u.id AND ur.revoked_at IS NULL) AS active_roles,
            (SELECT COUNT(*) FROM forge_mentors m WHERE m.user_id = u.id) AS mentor_links
       FROM forge_users u ORDER BY u.id`
  )

  const before = {}
  const after = {}
  const changes = []
  const roleless = []
  for (const user of users) {
    const slugs = user.active_roles ? String(user.active_roles).split(',') : []
    const target = targetOf(slugs)
    for (const slug of slugs) before[slug] = (before[slug] ?? 0) + 1
    if (slugs.length === 0) before['(no role)'] = (before['(no role)'] ?? 0) + 1
    after[target] = (after[target] ?? 0) + 1

    const unchanged = slugs.length === 1 && slugs[0] === target
    if (unchanged) continue
    const losing = slugs.filter((slug) => slug !== target)
    const row = {
      id: user.id,
      appId: user.app_id,
      name: user.full_name,
      deleted: Boolean(user.deleted_at),
      from: slugs.length ? slugs.map(label).join(' + ') : '(no role)',
      to: label(target),
      losing,
      mentor: Number(user.mentor_links) > 0,
    }
    changes.push(row)
    if (slugs.length === 0) roleless.push(row)
  }

  console.log(`Users in forge_users: ${users.length} (including soft-deleted)\n`)
  console.log('Active role rows per role — NOW (a multi-role user is counted once per role):')
  for (const [slug, n] of Object.entries(before)) console.log(`  ${label(slug).padEnd(18)} ${n}`)
  console.log('\nUsers per role — AFTER migration (exactly one each):')
  for (const slug of PRIORITY) console.log(`  ${label(slug).padEnd(18)} ${after[slug] ?? 0}`)

  console.log(`\nUsers whose role would CHANGE: ${changes.length}`)
  for (const row of changes) {
    console.log(
      `  #${row.id} ${row.appId} ${row.name}${row.deleted ? ' [soft-deleted]' : ''}: ${row.from} → ${row.to}`
    )
  }

  const losers = changes.filter((row) => row.losing.some((slug) => slug !== 'network-member'))
  console.log(`\nUsers who would LOSE a real role (not counting network-member): ${losers.length}`)
  for (const row of losers) {
    console.log(`  #${row.id} ${row.appId} ${row.name}: keeps ${row.to}, loses ${row.losing.map(label).join(', ')}`)
  }

  console.log(`\nUsers with NO role today (they become Job Seekers): ${roleless.length}`)
  for (const row of roleless) {
    console.log(`  #${row.id} ${row.appId} ${row.name}${row.mentor ? ' — linked to a mentor record' : ''}`)
  }

  // network-member
  const [[nm]] = await conn.query(`SELECT id FROM forge_roles WHERE slug = 'network-member'`)
  if (nm) {
    const [[counts]] = await conn.query(
      `SELECT SUM(revoked_at IS NULL) AS active, SUM(revoked_at IS NOT NULL) AS revoked
         FROM forge_user_roles WHERE role_id = ?`,
      [nm.id]
    )
    const [[regs]] = await conn.query(
      `SELECT COUNT(*) AS n FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_registration_requests'`
    )
    const [[pointing]] = regs.n
      ? await conn.query(`SELECT COUNT(*) AS n FROM forge_registration_requests WHERE approved_role_id = ?`, [nm.id])
      : [[{ n: 0 }]]
    console.log(
      `\nnetwork-member role (id ${nm.id}): held by ${Number(counts.active ?? 0)} user(s) today — each keeps their ` +
        `highest other role, or becomes a Job Seeker (see the list above). All ${Number(counts.active ?? 0) + Number(counts.revoked ?? 0)} ` +
        `network-member role row(s) are then removed, ${pointing.n} registration(s) are re-pointed to Job Seeker, ` +
        'and the role itself is deleted.'
    )
  } else {
    console.log('\nnetwork-member role: already removed.')
  }

  // Staff accounts on a non-Atlas email (the migration does NOT change these;
  // fix them by hand or with the Backend Manager role change).
  const staffBad = users.filter((user) => {
    const target = targetOf(user.active_roles ? String(user.active_roles).split(',') : [])
    return STAFF.includes(target) && !isAtlas(user.email) && !user.deleted_at
  })
  console.log(`\nStaff accounts (after migration) whose email is NOT ${ATLAS}: ${staffBad.length}`)
  for (const user of staffBad) console.log(`  #${user.id} ${user.app_id} ${user.full_name} <${user.email}>`)

  // Pending registrations the new approval rules would refuse.
  const [[hasReg]] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_registration_requests'`
  )
  if (hasReg.n) {
    const [pending] = await conn.query(
      `SELECT rr.id, rr.reference, rr.role_category, rr.email, rr.student_application_id,
              (SELECT u.app_id FROM forge_users u WHERE u.email = rr.email LIMIT 1) AS email_owner,
              (SELECT u.app_id FROM forge_users u WHERE u.app_id = rr.student_application_id LIMIT 1) AS appid_owner,
              CHAR_LENGTH(rr.student_application_id) AS id_len
         FROM forge_registration_requests rr WHERE rr.status = 'pending' ORDER BY rr.id`
    )
    const problems = []
    for (const row of pending) {
      const why = []
      if (['atlas_student', 'atlas_faculty'].includes(row.role_category) && !isAtlas(row.email)) why.push('not an Atlas email')
      if (row.role_category === 'atlas_student' && !String(row.student_application_id ?? '').trim()) why.push('no Application ID')
      if (row.email_owner) why.push(`email already belongs to ${row.email_owner}`)
      if (row.appid_owner) why.push(`Application ID already used as App ID by ${row.appid_owner}`)
      if (why.length) problems.push(`  ${row.reference} (${row.role_category}): ${why.join('; ')}`)
    }
    console.log(`\nPending registrations: ${pending.length}; would be REFUSED at approval: ${problems.length}`)
    for (const line of problems) console.log(line)
  }

  console.log('\nNothing was changed. (Read-only transaction, rolled back.)\n')
  await conn.query('ROLLBACK')
} finally {
  await conn.end()
}
