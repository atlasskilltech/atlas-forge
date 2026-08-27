import 'server-only'

import { transaction } from '@/lib/db'
import { NotFoundError, ValidationError } from '@/lib/errors'
import * as mentorship from '@/lib/repositories/mentorship.repository'
import * as platform from '@/lib/repositories/platform.repository'
import { getMentorTypes, resolveId } from './lookups.service'

export const listMentors = (filters) => mentorship.findMentors(filters)

/**
 * The alumni mentors a founder may browse. Distinct from `listMentors`, which
 * is staff-only because it carries contact details — see the note on
 * SELECT_MENTORS. A founder screen must call this one.
 */
export const listAlumniDirectory = (filters) => mentorship.findAlumniDirectory(filters)
export const getPrimaryMentor = () => mentorship.findPrimaryMentor()
export const listRequests = (filters) => mentorship.findRequests(filters)
export const listSessions = (filters) => mentorship.findSessions(filters)
export const countPendingRequests = () => mentorship.countPendingRequests()

/** Mentors grouped by type — the picker groups them by skill focus. */
export async function listMentorsGrouped() {
  const mentors = await mentorship.findMentors()
  const groups = new Map()
  for (const mentor of mentors) {
    const key = mentor.type?.name ?? 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(mentor)
  }
  return [...groups.entries()].map(([name, items]) => ({ name, mentors: items }))
}

export async function requestSession({
  requesterId,
  startupId = null,
  topic,
  context = null,
  preferredMentorTypeSlug = null,
  preferredTiming = null,
}) {
  if (!topic?.trim()) throw new ValidationError('Describe what you need help with.')

  const preferredMentorTypeId = await resolveId(getMentorTypes, preferredMentorTypeSlug)

  return transaction(async (tx) => {
    const requestId = await mentorship.createRequest(
      {
        requesterId,
        startupId,
        topic: topic.trim(),
        context,
        preferredMentorTypeId,
        preferredTiming,
      },
      tx
    )

    // A request is visible as a pending session before any mentor is assigned —
    // that is the "Mentor: TBD / Pending Assignment" card.
    await mentorship.createSession(
      {
        requestId,
        mentorId: null,
        menteeId: requesterId,
        startupId,
        topic: topic.trim(),
        status: 'requested',
      },
      tx
    )

    await platform.logActivity(
      {
        actorUserId: requesterId,
        action: 'Requested mentorship session',
        module: 'Mentorship',
        entityType: 'mentorship_request',
        entityId: requestId,
        status: 'pending',
      },
      tx
    )

    return requestId
  })
}

/**
 * Assign a mentor to a pending request: the request closes, its placeholder
 * session gains a mentor and a schedule, and the student is notified.
 */
export async function assignMentor({ requestId, mentorId, scheduledAt = null, actorId }) {
  const [request] = await mentorship.findRequests({}).then((rows) =>
    rows.filter((row) => row.id === Number(requestId))
  )
  if (!request) throw new NotFoundError('Mentorship request')

  const mentors = await mentorship.findMentors()
  const mentor = mentors.find((m) => m.id === Number(mentorId))
  if (!mentor) throw new NotFoundError('Mentor')

  return transaction(async (tx) => {
    await mentorship.updateRequestStatus(requestId, 'assigned', tx)

    await mentorship.createSession(
      {
        requestId,
        mentorId: mentor.id,
        menteeId: request.requester.id,
        topic: request.topic,
        scheduledAt,
        assignedBy: actorId,
        status: scheduledAt ? 'upcoming' : 'requested',
      },
      tx
    )

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Assigned ${mentor.name} to ${request.requester.name}`,
        module: 'Mentorship',
        entityType: 'mentorship_request',
        entityId: requestId,
        status: 'success',
      },
      tx
    )

    await platform.createNotification(
      {
        userId: request.requester.id,
        type: 'mentorship',
        title: 'Mentor assigned',
        body: `${mentor.name} has been assigned to "${request.topic}".`,
        linkUrl: '/student/mentorship',
        entityType: 'mentorship_request',
        entityId: requestId,
      },
      tx
    )

    return true
  })
}
