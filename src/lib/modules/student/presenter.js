import {
  agoLabel,
  dayTimeLabel,
  isThisMonth,
  joinMeta,
  scheduleLabel,
  yearLabel,
} from '@/lib/utils/format'

/**
 * Domain objects → the exact props the Student components already render.
 *
 * This is the only place that knows about chip tones, avatar tints and label
 * copy. Repositories stay free of presentation and components stay free of
 * database vocabulary: a component never sees `under_review`, and a query
 * never has to know it is drawn as an amber chip.
 *
 * Pure functions — no database, no environment, no request state — so every
 * mapping below is directly testable.
 */

/* -------------------------------------------------------------------------- */
/* Status vocabularies                                                        */
/* -------------------------------------------------------------------------- */

const APPLICATION_STATUS = {
  applied: { label: 'Applied', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'warning' },
  shortlisted: { label: 'Shortlisted', tone: 'info' },
  interview: { label: 'Interview', tone: 'success' },
  // The reference draws the decline chip as "Not Selected"; the stored value
  // is `not_selected`. `selected` is the other outcome of the same step.
  selected: { label: 'Selected', tone: 'success' },
  not_selected: { label: 'Not Selected', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

/**
 * Applications that still count as "in flight" on the dashboard counters.
 * `selected` is an outcome, not an open application, so it is excluded
 * alongside `not_selected` and `withdrawn`.
 */
const OPEN_APPLICATION_STATUSES = ['applied', 'under_review', 'shortlisted', 'interview']

const SESSION_STATUS = {
  requested: { label: 'Requested', tone: 'warning' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

/**
 * `activity_logs.status` describes how the recorded action ended. `success`
 * reads as "Active" because in this log a successful action is one whose
 * result is now live — a flagged availability, an approved listing.
 */
const ACTIVITY_STATUS = {
  logged: { label: 'Logged', tone: 'neutral', dot: 'primary' },
  pending: { label: 'Pending', tone: 'info', dot: 'primary' },
  success: { label: 'Active', tone: 'success', dot: 'success' },
  action: { label: 'Actioned', tone: 'warning', dot: 'warning' },
  failed: { label: 'Failed', tone: 'danger', dot: 'danger' },
}

const FALLBACK = { label: '—', tone: 'neutral' }

export const isOpenApplication = (application) =>
  OPEN_APPLICATION_STATUSES.includes(application.status)

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

/** The `studentProfile` shape consumed by ProfilePanel and AvailabilityPanel. */
export function toProfile(profile) {
  const skills = (profile.skills ?? []).map((skill) => skill.name)
  const hours = profile.hoursPerWeek ? `${profile.hoursPerWeek} hrs/week` : null

  return {
    id: profile.id,
    name: profile.name,
    initials: profile.initials,
    programme: profile.programme ?? '',
    year: yearLabel(profile.yearOfStudy),
    appId: profile.appId,
    email: profile.email,
    isAvailable: profile.isAvailable,
    availability: profile.isAvailable
      ? joinMeta('Available', hours)
      : 'Not currently available',
    hoursPerWeek: hours ?? 'Not set',
    workTypes: profile.workTypes ?? 'Not set',
    timing: profile.availabilityTiming ?? 'Not set',
    concierge: profile.isAvailable
      ? joinMeta(
          'You are visible to Founders in the Service pool',
          hours,
          profile.availabilityTiming
        )
      : 'You are hidden from the Service pool. Turn availability on to be discoverable.',
    skills,
    // The mobile profile frame draws a shorter chip row than the desktop one.
    mobileSkills: skills.slice(0, 3),
    skillIds: (profile.skills ?? []).map((skill) => skill.id),
    /**
     * Unformatted values for forms that write back. The display fields above
     * are prose ("10 hrs/week"), which would fail validation if a form echoed
     * them into a request — so edits read from here instead.
     */
    raw: {
      hoursPerWeek: profile.hoursPerWeek,
      workTypes: profile.workTypes,
      timing: profile.availabilityTiming,
      bio: profile.bio,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export function toHomeStats({ openApplications, projectsExploring, upcomingSessions, isAvailable }) {
  return [
    {
      value: isAvailable ? 'Active' : 'Paused',
      label: 'Availability Status',
      tone: isAvailable ? 'success' : 'neutral',
    },
    { value: String(openApplications), label: 'Active Applications', tone: 'primary' },
    { value: String(projectsExploring), label: 'Projects Exploring', tone: 'primary' },
    {
      value: String(upcomingSessions),
      label: upcomingSessions === 1 ? 'Mentorship Session' : 'Mentorship Sessions',
      tone: 'primary',
    },
  ]
}

export function toMobileHomeStats({ openApplications, upcomingSessions, isAvailable }) {
  return [
    { value: String(openApplications), label: 'Applications', tone: 'primary' },
    { value: String(upcomingSessions), label: 'Mentor', tone: 'primary' },
    {
      value: isAvailable ? 'Active' : 'Paused',
      label: 'Available',
      tone: isAvailable ? 'success' : 'neutral',
    },
  ]
}

/** The four counters on My Profile — the same numbers, ordered as drawn there. */
export function toProfileStats({ openApplications, upcomingSessions, projectsExploring, isAvailable }) {
  return [
    { value: String(openApplications), label: 'Active Applications', tone: 'primary' },
    {
      value: String(upcomingSessions),
      label: upcomingSessions === 1 ? 'Mentorship Session' : 'Mentorship Sessions',
      tone: 'primary',
    },
    { value: String(projectsExploring), label: 'Projects Exploring', tone: 'primary' },
    {
      value: isAvailable ? 'Active' : 'Paused',
      label: 'Availability',
      tone: isAvailable ? 'success' : 'neutral',
    },
  ]
}

export function toActivity(entry) {
  const status = ACTIVITY_STATUS[entry.status] ?? ACTIVITY_STATUS.logged
  return {
    id: `activity-${entry.id}`,
    title: entry.action,
    meta: dayTimeLabel(entry.createdAt),
    status: status.label,
    tone: status.tone,
    dot: status.dot,
  }
}

/* -------------------------------------------------------------------------- */
/* Jobs                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * @param listing   a listing with its skills attached
 * @param appliedTo Set of listing ids the signed-in student has applied to
 */
export function toJob(listing, appliedTo) {
  const company = listing.startup?.name ?? listing.createdBy?.name ?? 'ATLAS Forge'
  const type = listing.listingType?.name ?? (listing.type === 'collab' ? 'Collab / No Pay' : 'Role')
  const skills = (listing.skills ?? []).map((skill) => skill.name)

  return {
    id: String(listing.id),
    listingId: listing.id,
    title: listing.title,
    company,
    type,
    status: listing.type === 'collab' ? 'Collab' : 'Live',
    // The card shows a couple of chips; the detail pane shows the full set.
    skills: skills.slice(0, 2),
    detailSkills: skills,
    detailMeta: joinMeta(company, type, 'ATLAS Forge Incubated'),
    description: listing.description ?? '',
    applied: appliedTo.has(listing.id),
  }
}

/* -------------------------------------------------------------------------- */
/* Applications                                                               */
/* -------------------------------------------------------------------------- */

export function toApplication(application) {
  const status = APPLICATION_STATUS[application.status] ?? FALLBACK
  const type = application.listing?.typeName ?? null

  return {
    id: String(application.id),
    applicationId: application.id,
    role: application.listing?.title ?? 'Role',
    company: application.startup?.name ?? 'ATLAS Forge',
    initial: application.startup?.initial ?? application.listing?.title?.charAt(0) ?? '?',
    tone: application.startup?.avatarTone ?? 'primary',
    meta: joinMeta(type, `Applied ${agoLabel(application.appliedAt)}`),
    status: status.label,
    statusTone: status.tone,
  }
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export function toProject(startup, { now = new Date() } = {}) {
  return {
    id: startup.slug,
    slug: startup.slug,
    name: startup.name,
    initial: startup.initial ?? startup.name.charAt(0),
    tone: startup.avatarTone ?? 'primary',
    hiring: startup.isHiring,
    tags: [startup.industry?.name, startup.stage?.name].filter(Boolean),
    description: startup.tagline ?? '',
    openRoles: startup.openRoles ?? 0,
    sector: startup.industry?.name ?? 'Other',
    // Backs the "New This Month" filter, which the mock data could not answer.
    isNew: isThisMonth(startup.createdAt, { now }),
  }
}

/* -------------------------------------------------------------------------- */
/* Mentorship                                                                 */
/* -------------------------------------------------------------------------- */

export function toSession(session) {
  const status = SESSION_STATUS[session.status] ?? FALLBACK
  return {
    id: String(session.id),
    when: session.scheduledAt ? scheduleLabel(session.scheduledAt) : 'Pending Assignment',
    status: status.label,
    statusTone: status.tone,
    mentor: `Mentor: ${session.mentor?.name ?? 'TBD'}`,
    topic: session.topic ?? '',
  }
}

export function toAssignedMentor(mentor) {
  if (!mentor) return null
  return {
    name: mentor.name,
    initials: mentor.initials,
    role: joinMeta(mentor.isPrimary ? 'Forge Manager' : null, mentor.type?.name ?? 'Mentor'),
  }
}

/* -------------------------------------------------------------------------- */
/* Incubation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Input placeholders are example copy, not data — they describe how to fill a
 * field rather than say anything about the platform's state, so they live here
 * beside the other presentation strings instead of in `readiness_items`. The
 * label and hint both come from the database.
 */
const READINESS_PLACEHOLDER = {
  'pitch-deck': 'Paste link or attach file...',
  demo: 'https://...',
  assets: 'Paste link or attach file...',
  personnel: 'e.g. Riya Kapoor — Design, Arjun Mehta — Engineering',
}

export function toReadinessItem(item) {
  return {
    id: item.slug,
    label: item.name,
    hint: item.hint ?? '',
    placeholder: READINESS_PLACEHOLDER[item.slug] ?? 'Paste link or add details...',
  }
}
