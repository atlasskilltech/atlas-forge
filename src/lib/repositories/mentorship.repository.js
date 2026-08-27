import 'server-only'

import { execute, insert, query, queryOne, queryValue } from '@/lib/db'
import * as sql from '@/lib/queries/mentorship'
import { bool, inClause, iso, num, pair } from '@/lib/utils/rows'

/**
 * STAFF shape — carries contact details. Only reachable through `findMentors`,
 * which reads the staff-only statement.
 */
export const toMentor = (row) => ({
  id: num(row.id),
  userId: num(row.user_id),
  name: row.full_name,
  initials: row.initials,
  avatarTone: row.avatar_tone,
  isPrimary: bool(row.is_primary),
  type: row.mentor_type_name
    ? { name: row.mentor_type_name, slug: row.mentor_type_slug }
    : null,
  contact: { email: row.email ?? null, phone: row.phone ?? null, linkedinUrl: row.linkedin_url ?? null },
  roleTitle: row.role_title ?? null,
  city: row.city ?? null,
  course: row.course ?? null,
  graduationYear: num(row.graduation_year),
  industry: row.industry ?? null,
  experienceBand: row.experience_band ?? null,
  mentoringAvailability: row.mentoring_availability ?? null,
  importSource: row.import_source ?? null,
  skills: [],
})

/**
 * FOUNDER-FACING shape. There is no contact key to omit — the statement behind
 * it never selected those columns, so nothing downstream can render or
 * serialise them into the page payload.
 */
const toDirectoryMentor = (row) => ({
  id: num(row.id),
  name: row.full_name,
  initials: row.initials,
  avatarTone: row.avatar_tone,
  type: row.mentor_type_name
    ? { name: row.mentor_type_name, slug: row.mentor_type_slug }
    : null,
  roleTitle: row.role_title ?? null,
  city: row.city ?? null,
  graduationYear: num(row.graduation_year),
  experienceBand: row.experience_band ?? null,
  areas: [],
})

const toArea = (row) => ({ id: num(row.id), slug: row.slug, name: row.name })

const toSkill = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  category: row.category,
})

const toRequest = (row) => ({
  id: num(row.id),
  topic: row.topic,
  context: row.context,
  preferredTiming: row.preferred_timing,
  status: row.status,
  createdAt: iso(row.created_at),
  requester: {
    id: num(row.requester_id),
    name: row.requester_name,
    initials: row.requester_initials,
    avatarTone: row.requester_tone,
  },
  preferredType: row.preferred_type_name
    ? { name: row.preferred_type_name, slug: row.preferred_type_slug }
    : null,
  startupName: row.startup_name,
})

const toSession = (row) => ({
  id: num(row.id),
  // The request this session came from. Needed to tell whether a *request* has
  // been matched — a student can have several, and one being assigned says
  // nothing about the others.
  requestId: num(row.request_id),
  topic: row.topic,
  scheduledAt: iso(row.scheduled_at),
  status: row.status,
  notes: row.notes,
  createdAt: iso(row.created_at),
  mentor: row.mentor_id
    ? {
        id: num(row.mentor_id),
        name: row.mentor_name,
        initials: row.mentor_initials,
        typeName: row.mentor_type_name,
      }
    : null,
  mentee: { id: num(row.mentee_id), name: row.mentee_name, initials: row.mentee_initials },
  startupName: row.startup_name,
})

export async function findMentors({ typeSlug = null } = {}) {
  const rows = await query(sql.SELECT_MENTORS, [...pair(typeSlug)])
  const mentors = rows.map(toMentor)
  if (mentors.length === 0) return mentors

  const ids = mentors.map((m) => m.id)
  const skillRows = await query(sql.selectSkillsForMentors(inClause(ids)), ids)

  const byMentor = new Map(mentors.map((m) => [m.id, []]))
  for (const row of skillRows) byMentor.get(num(row.mentor_id))?.push(toSkill(row))

  return mentors.map((mentor) => ({ ...mentor, skills: byMentor.get(mentor.id) ?? [] }))
}

/**
 * Active alumni mentors for the founder directory, with their mentorship
 * areas. Two queries rather than a join with duplicated mentor rows, the same
 * shape `findMentors` uses for skills.
 */
export async function findAlumniDirectory({ areaSlug = null } = {}) {
  const rows = await query(sql.SELECT_ALUMNI_MENTOR_DIRECTORY, [...pair(areaSlug)])
  const mentors = rows.map(toDirectoryMentor)
  if (mentors.length === 0) return mentors

  const ids = mentors.map((mentor) => mentor.id)
  const areaRows = await query(sql.selectAreasForMentors(inClause(ids)), ids)

  const byMentor = new Map(mentors.map((mentor) => [mentor.id, []]))
  for (const row of areaRows) byMentor.get(num(row.mentor_id))?.push(toArea(row))

  return mentors.map((mentor) => ({ ...mentor, areas: byMentor.get(mentor.id) ?? [] }))
}

export async function findPrimaryMentor() {
  const row = await queryOne(sql.SELECT_PRIMARY_MENTOR)
  return row ? toMentor(row) : null
}

export async function findRequests({ requesterId = null, status = null } = {}) {
  const rows = await query(sql.SELECT_MENTORSHIP_REQUESTS, [
    ...pair(requesterId),
    ...pair(status),
  ])
  return rows.map(toRequest)
}

export async function findSessions({ menteeId = null, status = null } = {}) {
  const rows = await query(sql.SELECT_MENTORSHIP_SESSIONS, [
    ...pair(menteeId),
    ...pair(status),
  ])
  return rows.map(toSession)
}

export async function createRequest(data, conn) {
  return insert(
    sql.INSERT_MENTORSHIP_REQUEST,
    [
      data.requesterId,
      data.startupId ?? null,
      data.topic,
      data.context ?? null,
      data.preferredMentorTypeId ?? null,
      data.preferredTiming ?? null,
    ],
    conn
  )
}

export async function createSession(data, conn) {
  return insert(
    sql.INSERT_MENTORSHIP_SESSION,
    [
      data.requestId ?? null,
      data.mentorId ?? null,
      data.menteeId,
      data.startupId ?? null,
      data.topic,
      data.scheduledAt ?? null,
      data.assignedBy ?? null,
      data.status ?? 'requested',
    ],
    conn
  )
}

export async function updateRequestStatus(requestId, status, conn) {
  const { affectedRows } = await execute(sql.UPDATE_REQUEST_STATUS, [status, requestId], conn)
  return affectedRows > 0
}

export async function countPendingRequests() {
  return num(await queryValue(sql.COUNT_PENDING_REQUESTS)) ?? 0
}
