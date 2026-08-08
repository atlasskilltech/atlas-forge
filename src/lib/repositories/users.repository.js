import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/users'
import { applyFullListCap, withFullListCap } from '@/lib/queries/pagination'
import { bool, inClause, iso, num } from '@/lib/utils/rows'

export const toUser = (row) => ({
  id: num(row.id),
  appId: row.app_id,
  name: row.full_name,
  email: row.email,
  initials: row.initials,
  avatarTone: row.avatar_tone,
  bio: row.bio ?? null,
  status: row.status,
  lastActiveAt: iso(row.last_active_at),
  createdAt: iso(row.created_at),
})

const toRole = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  description: row.description,
  isViewOnly: bool(row.is_view_only),
  isPrimary: bool(row.is_primary),
})

const toSkill = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  category: row.category,
})

const toStudentProfile = (row) => ({
  ...toUser(row),
  programme: row.programme,
  yearOfStudy: num(row.year_of_study),
  hoursPerWeek: num(row.hours_per_week),
  workTypes: row.work_types,
  availabilityTiming: row.availability_timing,
  isAvailable: bool(row.is_available),
  // Only selected by the pool query; undefined on a single-profile read.
  ...(row.projects_done === undefined
    ? {}
    : { projectsDone: num(row.projects_done) ?? 0, engagements: num(row.engagements) ?? 0 }),
})

export async function findById(id) {
  const row = await queryOne(sql.SELECT_USER_BY_ID, [id])
  return row ? toUser(row) : null
}

export async function findByAppId(appId) {
  const row = await queryOne(sql.SELECT_USER_BY_APP_ID, [appId])
  return row ? toUser(row) : null
}

/** Returns the password hash — only the auth service may call this. */
export async function findCredentials(identifier) {
  return queryOne(sql.SELECT_USER_CREDENTIALS, [identifier, identifier])
}

export async function findRoles(userId) {
  const rows = await query(sql.SELECT_USER_ROLES, [userId])
  return rows.map(toRole)
}

export async function findPermissions(userId) {
  const rows = await query(sql.SELECT_USER_PERMISSIONS, [userId])
  return rows.map((row) => row.slug)
}

export async function findStudentProfile(userId) {
  const row = await queryOne(sql.SELECT_STUDENT_PROFILE, [userId])
  return row ? toStudentProfile(row) : null
}

export async function findSkills(userId) {
  const rows = await query(sql.SELECT_USER_SKILLS, [userId])
  return rows.map(toSkill)
}

/**
 * The student pool with each student's skills attached.
 *
 * Skills are fetched in a single follow-up query keyed by the ids just
 * returned, rather than one query per student — an N+1 here would mean 1 + N
 * round trips on a screen that lists the whole pool.
 */
export async function findStudentPool({ track = null, availableOnly = null } = {}) {
  const available = availableOnly === null ? null : Boolean(availableOnly)
  const rows = await query(withFullListCap(sql.SELECT_STUDENT_POOL), [
    available === null ? null : 1,
    available,
    track,
    track,
  ])
  const students = applyFullListCap(rows, 'student pool').map(toStudentProfile)
  if (students.length === 0) return students

  const ids = students.map((s) => s.id)
  const placeholders = inClause(ids)
  const skillRows = await query(sql.selectSkillsForUsers(placeholders), ids)

  const byUser = new Map(students.map((s) => [s.id, []]))
  for (const row of skillRows) byUser.get(num(row.user_id))?.push(toSkill(row))

  return students.map((student) => ({ ...student, skills: byUser.get(student.id) ?? [] }))
}

export async function findAll() {
  const rows = await query(withFullListCap(sql.SELECT_ALL_USERS))
  return applyFullListCap(rows, 'user directory').map((row) => ({
    ...toUser(row),
    startupName: row.startup_name,
    roleNames: row.role_names ? row.role_names.split(', ') : [],
    roleSlugs: row.role_slugs ? row.role_slugs.split(',') : [],
    primaryRoleSlug: row.primary_role_slug,
  }))
}

export async function create(data, conn) {
  return insert(
    sql.INSERT_USER,
    [
      data.appId,
      data.name,
      data.email,
      data.passwordHash,
      data.initials ?? null,
      data.avatarTone ?? 'primary',
      data.bio ?? null,
      data.status ?? 'active',
    ],
    conn
  )
}

export async function updateProfile(userId, { name, email, bio }, conn) {
  const { affectedRows } = await execute(
    sql.UPDATE_USER_PROFILE,
    [name, email, bio ?? null, userId],
    conn
  )
  return affectedRows > 0
}

export async function touchLastActive(userId, conn) {
  await execute(sql.UPDATE_LAST_ACTIVE, [userId], conn)
}

export async function upsertStudentProfile(userId, data, conn) {
  await execute(
    sql.UPSERT_STUDENT_PROFILE,
    [
      userId,
      data.programme ?? null,
      data.yearOfStudy ?? null,
      data.hoursPerWeek ?? null,
      data.workTypes ?? null,
      data.availabilityTiming ?? null,
      data.isAvailable ?? false,
    ],
    conn
  )
}

export async function updateAvailability(userId, data, conn) {
  const { affectedRows } = await execute(
    sql.UPDATE_AVAILABILITY,
    [
      data.isAvailable ?? false,
      data.hoursPerWeek ?? null,
      data.workTypes ?? null,
      data.availabilityTiming ?? null,
      userId,
    ],
    conn
  )
  return affectedRows > 0
}

/** Replaces a student's skill set. Caller supplies a transaction connection. */
export async function replaceSkills(userId, skillIds, conn) {
  await execute(sql.DELETE_USER_SKILLS, [userId], conn)
  for (const skillId of skillIds) {
    await execute(sql.INSERT_USER_SKILL, [userId, skillId], conn)
  }
}

export async function grantRole(userId, roleId, { isPrimary = false, grantedBy = null } = {}, conn) {
  await execute(sql.GRANT_ROLE, [userId, roleId, isPrimary, grantedBy], conn)
}

export async function revokeRole(userId, roleId, conn) {
  const { affectedRows } = await execute(sql.REVOKE_ROLE, [userId, roleId], conn)
  return affectedRows > 0
}

export async function softDelete(userId, conn) {
  const { affectedRows } = await execute(sql.SOFT_DELETE_USER, [userId], conn)
  return affectedRows > 0
}

export async function countActiveApplications(userId) {
  return num(await queryValue('SELECT COUNT(*) FROM applications WHERE applicant_user_id = ? AND deleted_at IS NULL', [userId]))
}
