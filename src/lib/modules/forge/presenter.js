import {
  agoLabel,
  dayLabel,
  dayTimeLabel,
  joinMeta,
  scheduleLabel,
  shortName,
  timeLabel,
  yearLabel,
} from '@/lib/utils/format'
import { classifyAccount } from '@/lib/modules/accounts'

/**
 * Domain objects → the exact props the Forge Manager components already render.
 *
 * Same contract as the Student and Founder presenters: pure functions, no
 * database, no request state. Chip tones and label copy live here so
 * repositories stay free of presentation.
 */

/* -------------------------------------------------------------------------- */
/* Status vocabularies                                                        */
/* -------------------------------------------------------------------------- */

const LISTING_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
}

const CONTACT_STATUS = {
  pending: { label: 'Pending', tone: 'info' },
  ongoing: { label: 'Ongoing', tone: 'success' },
  done: { label: 'Done', tone: 'neutral' },
}

const CONTRACT_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Ongoing', tone: 'success' },
  completed: { label: 'Done', tone: 'neutral' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

const SESSION_STATUS = {
  requested: { label: 'Requested', tone: 'warning' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

const STARTUP_STATUS = {
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const INCUBATION_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

const NEED_STATUS = {
  open: { label: 'Open', tone: 'success' },
  filled: { label: 'Filled', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
}

const ACTIVITY_STATUS = {
  logged: { label: 'Logged', tone: 'neutral', dot: 'primary' },
  pending: { label: 'Pending', tone: 'info', dot: 'primary' },
  success: { label: 'Granted', tone: 'success', dot: 'success' },
  action: { label: 'Rejected', tone: 'danger', dot: 'danger' },
  failed: { label: 'Failed', tone: 'danger', dot: 'danger' },
}

const FALLBACK = { label: '—', tone: 'neutral' }

// Re-exported so callers that already import from this presenter keep working.
export { shortName }

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export function toDashboardStats(stats) {
  return [
    { value: String(stats.total_students), label: 'Total Students', tone: 'primary' },
    { value: String(stats.pending_incubations), label: 'Pending Approvals', tone: 'warning' },
    { value: String(stats.active_startups), label: 'Active Startups', tone: 'success' },
    { value: String(stats.pending_listings), label: 'Jobs in Queue', tone: 'primary' },
    { value: String(stats.mentor_requests), label: 'Mentor Requests', tone: 'primary' },
  ]
}

export function toMobileDashboardStats(stats) {
  return [
    { value: String(stats.pending_listings), label: 'Pending', tone: 'warning' },
    { value: String(stats.total_students), label: 'Students', tone: 'primary' },
    { value: String(stats.active_startups), label: 'Startups', tone: 'success' },
    { value: String(stats.live_listings), label: 'Jobs', tone: 'success' },
  ]
}

/**
 * A queue row on the dashboard.
 *
 * The monogram is the kind of thing awaiting a decision — J for a job listing,
 * C for a collab, M for a mentorship request — which is what the reference
 * draws rather than an avatar of the person.
 */
export function toQueueEntry(listing) {
  const isCollab = listing.type === 'collab'
  return {
    id: `queue-${listing.id}`,
    initial: isCollab ? 'C' : 'J',
    tone: isCollab ? 'primary' : 'warning',
    title: joinMeta(listing.title, listing.startup?.name),
    meta: joinMeta(
      isCollab ? 'Collab Post' : 'Job Listing',
      shortName(listing.createdBy?.name),
      dayLabel(listing.postedAt ?? listing.createdAt)
    ),
  }
}

export function toQueueRequest(request) {
  return {
    id: `queue-request-${request.id}`,
    initial: 'M',
    tone: 'success',
    title: `${request.topic} — ${shortName(request.requester.name)}`,
    meta: joinMeta(
      'Mentorship',
      request.preferredType ? `${request.preferredType.name} needed` : 'No preference',
      dayLabel(request.createdAt)
    ),
  }
}

export function toDashboardContact(contact) {
  const status = CONTACT_STATUS[contact.status] ?? FALLBACK
  return {
    id: `dash-contact-${contact.id}`,
    title: `${shortName(contact.founder.name)} → ${contact.student.name}`,
    meta: joinMeta(
      contact.context,
      contact.durationLabel,
      dayLabel(contact.contactedAt),
      timeLabel(contact.contactedAt)
    ),
    status: status.label,
    tone: status.tone,
  }
}

export function toMobilePending(listing) {
  return {
    id: `pending-${listing.id}`,
    title: listing.title,
    meta: joinMeta(listing.startup?.name, listing.type === 'collab' ? 'Collab' : 'Job Listing'),
    status: 'Pending',
  }
}

/* -------------------------------------------------------------------------- */
/* Approval queue                                                             */
/* -------------------------------------------------------------------------- */

/**
 * A queue item, carrying the decision already recorded for it.
 *
 * `decision` is the Forge Manager's own recorded verdict, not the listing's
 * status: a Backend Manager override can leave a listing live that the Forge
 * Manager rejected, and this screen should still show what *this* role
 * decided.
 */
export function toApprovalItem(listing) {
  const isCollab = listing.type === 'collab'
  const status = LISTING_STATUS[listing.status] ?? FALLBACK
  const skills = (listing.skills ?? []).map((skill) => skill.name)

  return {
    id: String(listing.id),
    listingId: listing.id,
    initial: isCollab ? 'C' : 'J',
    tone: isCollab ? 'primary' : 'warning',
    title: isCollab ? joinMeta(listing.title, listing.startup?.name) : listing.title,
    mobileTitle: listing.title,
    meta: joinMeta(
      listing.startup?.name,
      listing.listingType?.name,
      shortName(listing.createdBy?.name)
    ),
    mobileMeta: joinMeta(listing.startup?.name, isCollab ? 'Collab Post' : 'Job Listing'),
    skills: skills.slice(0, 2),
    kind: isCollab ? 'collab' : 'job',
    status: status.label,
    statusTone: status.tone,
    decision: listing.forgeDecision ?? null,
    overriddenBy: listing.backendDecision ?? null,
  }
}

/** Tab labels carry live counts, as the reference draws them. */
export function toApprovalTabs(items) {
  const pending = items.filter((item) => !item.decision)
  const jobs = pending.filter((item) => item.kind === 'job')
  const collabs = pending.filter((item) => item.kind === 'collab')
  return [
    `All (${pending.length})`,
    `Job Listings (${jobs.length})`,
    `Collab Posts (${collabs.length})`,
    'Approved',
    'Rejected',
  ]
}

/* -------------------------------------------------------------------------- */
/* Student pool                                                               */
/* -------------------------------------------------------------------------- */

export function toPoolStudent(student) {
  const skills = (student.skills ?? []).map((skill) => skill.name)
  const year = yearLabel(student.yearOfStudy)
  const degree = student.programme?.split(' ')[0] ?? ''

  return {
    id: String(student.id),
    userId: student.id,
    name: student.name,
    initials: student.initials,
    tone: student.avatarTone ?? 'primary',
    appId: student.appId,
    meta: joinMeta(degree, year, student.appId),
    detailMeta: joinMeta(student.programme, year, student.appId),
    mobileMeta: joinMeta(degree, skills[0], student.isAvailable ? 'Available' : 'Unavailable'),
    skills: skills.slice(0, 2),
    detailSkills: skills,
    available: student.isAvailable,
    track: skills.length > 0 ? student.skills[0].category : null,
    stats: [
      {
        value: student.hoursPerWeek ? `${student.hoursPerWeek} hrs` : '—',
        label: 'Per week',
        tone: 'ink',
      },
      { value: String(student.engagements ?? 0), label: 'Engagements', tone: 'primary' },
      { value: String(student.projectsDone ?? 0), label: 'Projects done', tone: 'primary' },
    ],
  }
}

/* -------------------------------------------------------------------------- */
/* Mentorship                                                                 */
/* -------------------------------------------------------------------------- */

export function toMentorRequest(request) {
  return {
    id: String(request.id),
    requestId: request.id,
    initials: request.requester.initials,
    tone: request.requester.avatarTone ?? 'primary',
    title: joinMeta(request.requester.name, request.startupName),
    detail: request.topic,
    kind: request.preferredType?.name ?? 'No preference',
    kindTone: 'success',
  }
}

export function toMentorOption(mentor) {
  return {
    id: String(mentor.id),
    mentorId: mentor.id,
    name: mentor.name,
    short: mentor.name.split(' ').slice(0, 2).join(' '),
    initials: mentor.initials,
    kind: mentor.type?.name ?? 'Mentor',
    skills: (mentor.skills ?? []).map((skill) => skill.name),
  }
}

export function toSessionLogEntry(session) {
  const status = SESSION_STATUS[session.status] ?? FALLBACK
  const mentorLabel = session.mentor
    ? joinMeta(session.mentor.name, session.mentor.typeName ? `(${session.mentor.typeName})` : null)
        .replace(' · (', ' (')
    : 'an unassigned mentor'

  return {
    id: `session-${session.id}`,
    title: `${shortName(session.mentee.name)} with ${mentorLabel}`,
    meta: joinMeta(
      session.topic,
      session.scheduledAt ? scheduleLabel(session.scheduledAt) : 'Pending'
    ),
    status: status.label,
    tone: status.tone,
  }
}

/**
 * The mobile Assign Mentors cards, which are about students rather than
 * requests: who is waiting, and who has already been matched.
 */
export function toMobileAssignment(request, assignedSession) {
  return {
    id: `assignment-${request.id}`,
    initials: request.requester.initials,
    tone: request.requester.avatarTone ?? 'primary',
    name: request.requester.name,
    meta: joinMeta(
      request.preferredType?.name ?? 'No preference',
      assignedSession ? 'Assigned' : 'Unassigned'
    ),
    assigned: Boolean(assignedSession),
    assignedTo: assignedSession?.mentor?.name ?? null,
    requestId: request.id,
  }
}

/* -------------------------------------------------------------------------- */
/* Incubation                                                                 */
/* -------------------------------------------------------------------------- */

export function toIncubationApplication(application, hasGrant) {
  const status = INCUBATION_STATUS[application.status] ?? FALLBACK
  return {
    id: String(application.id),
    applicationId: application.id,
    name: application.startup?.name ?? application.ideaName,
    founder: application.applicant.name,
    stage: application.stage?.name ?? '—',
    status: status.label,
    tone: status.tone,
    // Access is already granted when a live grant exists — the button reflects
    // the grant, not the application's status, because the two can differ.
    granted: hasGrant,
    completionPct: application.completionPct,
  }
}

/* -------------------------------------------------------------------------- */
/* Listings                                                                   */
/* -------------------------------------------------------------------------- */

export function toListingRow(listing) {
  const status = LISTING_STATUS[listing.status] ?? FALLBACK
  return {
    id: String(listing.id),
    listingId: listing.id,
    title: listing.title,
    startup: listing.startup?.name ?? '—',
    type: listing.listingType?.name ?? (listing.type === 'collab' ? 'Collab' : 'Role'),
    by: shortName(listing.createdBy?.name),
    date: dayLabel(listing.postedAt ?? listing.createdAt),
    status: status.label,
    tone: status.tone,
    kind: listing.type,
  }
}

export function toListingCounts(listings) {
  const count = (status) => listings.filter((listing) => listing.status === status).length
  return [
    { label: `${count('Live')} Live`, tone: 'success' },
    { label: `${count('Pending')} Pending`, tone: 'warning' },
    { label: `${count('Rejected')} Rejected`, tone: 'danger' },
  ]
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export function toProject(startup) {
  const status = STARTUP_STATUS[startup.status] ?? FALLBACK
  return {
    id: startup.slug,
    slug: startup.slug,
    startupId: startup.id,
    name: startup.name,
    initial: startup.initial ?? startup.name.charAt(0),
    tone: startup.avatarTone ?? 'primary',
    status: status.label,
    statusTone: status.tone,
    tags: [startup.industry?.name, startup.stage?.name].filter(Boolean),
    founder: shortName(startup.owner?.name),
    team: startup.teamSize ?? 0,
    openRoles: startup.openRoles ?? 0,
    sector: startup.industry?.name ?? 'Other',
    featured: startup.isFeatured,
  }
}

/* -------------------------------------------------------------------------- */
/* Contacts, contracts, needs, logs                                           */
/* -------------------------------------------------------------------------- */

export function toContactStats(stats) {
  return [
    { value: String(stats.total), label: 'Total Contacts', tone: 'primary' },
    { value: String(stats.thisWeek), label: 'This Week', tone: 'primary' },
    { value: String(stats.ongoing), label: 'Ongoing', tone: 'success' },
    { value: String(stats.completed), label: 'Completed', tone: 'primary' },
  ]
}

export function toContactRow(contact) {
  const status = CONTACT_STATUS[contact.status] ?? FALLBACK
  return {
    id: `contact-${contact.id}`,
    founder: shortName(contact.founder.name),
    student: contact.student.name,
    context: joinMeta(contact.context, contact.durationLabel),
    date: `${dayLabel(contact.contactedAt)} ${timeLabel(contact.contactedAt)}`,
    ccd: contact.ccName ?? 'Not CC’d',
    status: status.label,
    tone: status.tone,
  }
}

/**
 * A contract rendered into the contact-log row shape.
 *
 * The Contract Log route reuses the Contact Log table because they carry the
 * same columns, but the rows are contracts — the engagements actually agreed —
 * not the outreach that preceded them.
 */
export function toContractRow(contract) {
  const status = CONTRACT_STATUS[contract.status] ?? FALLBACK
  return {
    id: `contract-${contract.id}`,
    founder: shortName(contract.founderName),
    student: contract.studentName,
    context: joinMeta(contract.title, contract.startupName),
    date: contract.startedAt ? dayLabel(contract.startedAt) : dayLabel(contract.createdAt),
    ccd: contract.listingTitle ?? '—',
    status: status.label,
    tone: status.tone,
  }
}

export function toContractStats(contracts) {
  const count = (status) => contracts.filter((contract) => contract.status === status).length
  return [
    { value: String(contracts.length), label: 'Total Contracts', tone: 'primary' },
    { value: String(count('draft')), label: 'Draft', tone: 'primary' },
    { value: String(count('active')), label: 'Ongoing', tone: 'success' },
    { value: String(count('completed')), label: 'Completed', tone: 'primary' },
  ]
}

export function toPostedNeed(need) {
  const status = NEED_STATUS[need.status] ?? FALLBACK
  return {
    id: `need-${need.id}`,
    title: need.title,
    meta: joinMeta(need.startup?.name, shortName(need.founderName), `Posted ${agoLabel(need.postedAt)}`),
    status: status.label,
    tone: status.tone,
  }
}

export function toPlatformLog(entry) {
  const status = ACTIVITY_STATUS[entry.status] ?? ACTIVITY_STATUS.logged
  return {
    id: `log-${entry.id}`,
    title: entry.action,
    meta: joinMeta(
      entry.actor ? `By ${shortName(entry.actor.name)}` : 'System',
      dayTimeLabel(entry.createdAt)
    ),
    status: status.label,
    tone: status.tone,
    dot: status.dot,
  }
}

/* -------------------------------------------------------------------------- */
/* User accounts                                                              */
/* -------------------------------------------------------------------------- */

/**
 * A directory row.
 *
 * The Role column shows the account's standing rather than a raw role list:
 * a student who has been granted Founder access reads "Founder Unlocked",
 * which is the distinction this screen exists to make visible.
 *
 * The precedence rule is shared with the Backend Manager's directory — see
 * `classifyAccount` — so the same person cannot be a Founder on one screen and
 * a Manager on the other.
 */
export function toUserAccount(user) {
  const { group, role } = classifyAccount(user)
  const isFounder = group === 'Founders'

  return {
    id: String(user.id),
    userId: user.id,
    name: user.name,
    short: user.name,
    initials: user.initials,
    tone: user.avatarTone ?? 'primary',
    appId: user.appId,
    role,
    group,
    status: user.status === 'active' ? 'Active' : 'Inactive',
    tone2: user.status === 'active' ? 'success' : 'neutral',
    mobileRole: isFounder && user.startupName ? `Founder · ${user.startupName}` : role,
  }
}
