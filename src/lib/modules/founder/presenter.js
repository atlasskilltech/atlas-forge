import {
  agoLabel,
  dayLabel,
  dayTimeLabel,
  isThisMonth,
  joinMeta,
  scheduleLabel,
  timeLabel,
  yearLabel,
} from '@/lib/utils/format'
import { initials as initialsOf } from '@/lib/utils'

/**
 * Domain objects → the exact props the Founder components already render.
 *
 * Same contract as the Student presenter: pure functions, no database, no
 * request state. Chip tones and label copy live here so repositories stay free
 * of presentation and components stay free of database vocabulary.
 */

/* -------------------------------------------------------------------------- */
/* Status vocabularies                                                        */
/* -------------------------------------------------------------------------- */

/** How a listing's own status reads on the founder's own listing cards. */
const LISTING_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending Approval', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
}

/** The mobile listing cards abbreviate "Pending Approval" to "Pending". */
const LISTING_STATUS_SHORT = { pending: 'Pending' }

const CONTACT_STATUS = {
  pending: { label: 'Pending', tone: 'info' },
  ongoing: { label: 'Ongoing', tone: 'success' },
  done: { label: 'Done', tone: 'neutral' },
}

const SESSION_STATUS = {
  requested: { label: 'Requested', tone: 'warning' },
  upcoming: { label: 'Upcoming', tone: 'info' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

const ACTIVITY_STATUS = {
  logged: { label: 'Logged', tone: 'neutral', dot: 'primary' },
  pending: { label: 'Pending', tone: 'info', dot: 'primary' },
  success: { label: 'Live', tone: 'success', dot: 'success' },
  action: { label: 'Actioned', tone: 'warning', dot: 'warning' },
  failed: { label: 'Failed', tone: 'danger', dot: 'danger' },
}

const INCUBATION_STATUS = {
  draft: 'Draft',
  pending: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
}

const STARTUP_STATUS = {
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  under_review: { label: 'In Review', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const FALLBACK = { label: '—', tone: 'neutral' }

/* -------------------------------------------------------------------------- */
/* Profile                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * @param user     the signed-in founder
 * @param startup  the startup they own, or null
 * @param hasGrant whether an active founder_access_grant exists
 */
export function toProfile(user, startup, hasGrant) {
  return {
    id: user.id,
    name: user.name,
    shortName: user.name.split(' ')[0],
    initials: user.initials,
    role: 'Founder',
    startup: startup?.name ?? 'No startup yet',
    appId: user.appId,
    email: user.email,
    bio: user.bio ?? '',
    // The reference badge reads "Founder Unlocked". It is shown only when the
    // access grant that unlocked the role actually exists.
    badge: hasGrant ? 'Founder Unlocked' : 'Founder',
    raw: { name: user.name, email: user.email, bio: user.bio, startup: startup?.name ?? '' },
  }
}

/* -------------------------------------------------------------------------- */
/* Home                                                                       */
/* -------------------------------------------------------------------------- */

export function toHomeStats({ startup, openRoles, contacts, sessions }) {
  const status = STARTUP_STATUS[startup?.status] ?? FALLBACK
  return [
    { value: startup?.name ?? '—', label: 'My Startup', tone: 'ink' },
    { value: String(openRoles), label: 'Open Roles Posted', tone: 'primary' },
    { value: String(contacts), label: 'Student Contacts', tone: 'primary' },
    {
      value: String(sessions),
      label: sessions === 1 ? 'Mentorship Session' : 'Mentorship Sessions',
      tone: 'primary',
    },
    { value: status.label, label: 'Incubation Status', tone: status.tone },
  ]
}

export function toMobileHomeStats({ startup, teamSize, openRoles }) {
  return [
    { value: String(teamSize), label: 'Team', tone: 'primary' },
    { value: String(openRoles), label: 'Roles', tone: 'success' },
    { value: startup?.stage?.name ?? '—', label: 'Stage', tone: 'warning' },
  ]
}

/** The date chip in the top-right of the desktop dashboard. */
export function toHomeDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(now)
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

/**
 * The mobile feed is avatar-led: it answers "who did this", where the desktop
 * panel answers "what happened". Same rows, different emphasis.
 */
export function toMobileActivity(entry) {
  return {
    id: `mobile-activity-${entry.id}`,
    initials: entry.actor?.initials ?? '—',
    tone: entry.actor?.avatarTone ?? 'primary',
    title: entry.action,
    meta: dayLabel(entry.createdAt),
  }
}

/* -------------------------------------------------------------------------- */
/* Concierge / student pool                                                   */
/* -------------------------------------------------------------------------- */

export function toPoolStudent(student) {
  const skills = (student.skills ?? []).map((skill) => skill.name)
  const year = yearLabel(student.yearOfStudy)
  // "BDes Product Design" → "BDes" for the space-constrained card lines.
  const degree = student.programme?.split(' ')[0] ?? ''

  return {
    id: String(student.id),
    userId: student.id,
    name: student.name,
    initials: student.initials,
    tone: student.avatarTone ?? 'primary',
    meta: joinMeta(degree, year, student.appId),
    detailMeta: joinMeta(student.programme, year, student.appId),
    mobileMeta: joinMeta(degree, year, skills[0]),
    skills: skills.slice(0, 3),
    available: student.isAvailable,
    track: skills.length > 0 ? student.skills[0].category : null,
    stats: [
      { value: String(student.projectsDone ?? 0), label: 'Projects done', tone: 'primary' },
      {
        value: student.hoursPerWeek ? `${student.hoursPerWeek} hrs` : '—',
        label: 'Per week',
        tone: 'ink',
      },
      { value: String(student.engagements ?? 0), label: 'Engagements', tone: 'primary' },
    ],
  }
}

/** The compact contact-log rows in the Concierge right rail. */
export function toContactSummary(contact) {
  const status = CONTACT_STATUS[contact.status] ?? FALLBACK
  return {
    id: `contact-${contact.id}`,
    title: contact.student.name,
    detail: joinMeta(contact.context, contact.durationLabel),
    meta: joinMeta(
      dayTimeLabel(contact.contactedAt),
      contact.ccName ? `CC: ${contact.ccName}` : null
    ),
    status: status.label,
    tone: status.tone,
  }
}

/** The full Contact Log table and its mobile cards. */
export function toContactRow(contact) {
  const status = CONTACT_STATUS[contact.status] ?? FALLBACK
  return {
    id: `log-${contact.id}`,
    contactId: contact.id,
    student: contact.student.name,
    appId: contact.student.appId,
    context: joinMeta(contact.context, contact.durationLabel),
    when: `${dayLabel(contact.contactedAt)} · ${timeLabel(contact.contactedAt)}`,
    ccd: contact.ccName ?? 'Not CC’d',
    status: status.label,
    tone: status.tone,
    initials: contact.student.initials,
    avatarTone: contact.student.avatarTone ?? 'primary',
    mobileMeta: joinMeta(contact.context, contact.durationLabel, dayLabel(contact.contactedAt)),
  }
}

/* -------------------------------------------------------------------------- */
/* Projects                                                                   */
/* -------------------------------------------------------------------------- */

export function toProject(startup, { ownStartupId = null, now = new Date() } = {}) {
  const status = STARTUP_STATUS[startup.status] ?? FALLBACK
  return {
    id: startup.slug,
    slug: startup.slug,
    name: startup.name,
    initial: startup.initial ?? startup.name.charAt(0),
    tone: startup.avatarTone ?? 'primary',
    logoUrl: startup.logoUrl ?? null,
    mine: startup.id === ownStartupId,
    tags: [startup.industry?.name, startup.stage?.name].filter(Boolean),
    description: startup.tagline ?? '',
    teamSize: startup.teamSize ?? 0,
    hiring: startup.isHiring,
    featured: startup.isFeatured,
    isNew: isThisMonth(startup.createdAt, { now }),
    mobileMeta: joinMeta(status.label, startup.stage ? `${startup.stage.name} stage` : null),
    sector: startup.industry?.name ?? 'Other',
  }
}

/** The founder's own startup page. */
export function toMyStartup(startup, members) {
  const status = STARTUP_STATUS[startup.status] ?? FALLBACK
  const tags = [startup.industry?.name, startup.stage?.name].filter(Boolean)

  return {
    id: startup.id,
    slug: startup.slug,
    name: startup.name,
    // The reference draws a two-letter monogram here, unlike the one-letter
    // tile used in the project grid.
    initial: startup.name.slice(0, 2).toUpperCase(),
    // The uploaded logo takes the monogram's place when there is one.
    logoUrl: startup.logoUrl ?? null,
    tagline: startup.tagline ?? '',
    mobileTagline: startup.tagline ?? '',
    tags: startup.isHiring ? [...tags, 'Actively Hiring'] : tags,
    mobileTags: tags,
    stats: [
      { value: String(members.length), label: 'Team Members', tone: 'primary' },
      { value: String(startup.openRoles ?? 0), label: 'Open Roles', tone: 'primary' },
      { value: startup.stage?.name ?? '—', label: 'Stage', tone: 'success' },
      { value: status.label, label: 'Status', tone: status.tone },
    ],
    mobileStats: [
      { value: String(members.length), label: 'Team', tone: 'primary' },
      { value: String(startup.openRoles ?? 0), label: 'Roles', tone: 'success' },
      { value: status.label, label: 'Status', tone: status.tone },
    ],
    team: members.map(toTeamMember),
    raw: {
      name: startup.name,
      tagline: startup.tagline,
      problemStatement: startup.problemStatement,
      industrySlug: startup.industry?.slug ?? null,
      stageSlug: startup.stage?.slug ?? null,
      isHiring: startup.isHiring,
      openRoles: startup.openRoles ?? 0,
      logoUrl: startup.logoUrl ?? null,
    },
  }
}

function toTeamMember(member) {
  const [first, ...rest] = member.name.split(' ')
  return {
    id: `member-${member.id}`,
    name: member.name,
    // "Shantanu Ghuriani" → "Shantanu G." on the narrow mobile card.
    shortName: rest.length > 0 ? `${first} ${rest.at(-1).charAt(0)}.` : first,
    initials: member.initials,
    tone: member.avatarTone ?? 'primary',
    role: member.roleTitle,
    shortRole: member.roleTitle.split(' ').at(-1),
  }
}

/* -------------------------------------------------------------------------- */
/* Hiring                                                                     */
/* -------------------------------------------------------------------------- */

export function toListing(listing) {
  const status = LISTING_STATUS[listing.status] ?? FALLBACK
  const skills = (listing.skills ?? []).map((skill) => skill.name)
  const company = listing.startup?.name ?? 'ATLAS Forge'
  const type = listing.listingType?.name ?? (listing.type === 'collab' ? 'Collab / No Pay' : 'Role')

  return {
    id: String(listing.id),
    listingId: listing.id,
    title: listing.title,
    company,
    type,
    status: status.label,
    shortStatus: LISTING_STATUS_SHORT[listing.status] ?? status.label,
    tone: status.tone,
    skills: skills.slice(0, 3),
    detailSkills: skills,
    detailMeta: joinMeta(company, type, `Posted ${agoLabel(listing.postedAt ?? listing.createdAt)}`),
    description: listing.description ?? '',
    meta: joinMeta(type, company),
  }
}

const APPLICANT_STATUS = {
  applied: { label: 'Applied', tone: 'info' },
  under_review: { label: 'Under Review', tone: 'warning' },
  shortlisted: { label: 'Shortlisted', tone: 'info' },
  interview: { label: 'Interview', tone: 'success' },
  selected: { label: 'Selected', tone: 'success' },
  not_selected: { label: 'Not Selected', tone: 'neutral' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral' },
}

/**
 * An applicant row.
 *
 * `status` and `statusTone` are carried even though the reference draws no
 * status chip on this row — the founder is the one who moves the pipeline, so
 * the API that serves this screen must be able to say where each applicant
 * currently stands. The moment a control is designed, the data is already here.
 */
export function toApplicant(applicant) {
  const status = APPLICANT_STATUS[applicant.status] ?? FALLBACK

  return {
    id: `applicant-${applicant.applicationId}`,
    applicationId: applicant.applicationId,
    userId: applicant.id,
    name: applicant.name,
    initials: applicant.initials,
    tone: applicant.avatarTone ?? 'primary',
    meta: joinMeta(applicant.programme?.split(' ')[0], yearLabel(applicant.yearOfStudy)),
    status: status.label,
    statusTone: status.tone,
    rawStatus: applicant.status,
  }
}

/* -------------------------------------------------------------------------- */
/* Mentorship                                                                 */
/* -------------------------------------------------------------------------- */

export function toMentor(mentor) {
  if (!mentor) return null
  return {
    name: mentor.name,
    initials: mentor.initials,
    role: mentor.isPrimary
      ? 'Forge Manager · Primary Mentor for all incubated projects'
      : joinMeta(mentor.type?.name ?? 'Mentor'),
    note: 'Faculty, Alumni, and Industry mentors available for special project needs',
    mobileRole: joinMeta(mentor.isPrimary ? 'Forge Manager' : null, mentor.type?.name ?? 'Mentor'),
  }
}

/**
 * One alumni mentor card in the founder's directory.
 *
 * Name, what they do now, when they graduated, and what they can help with —
 * no email, phone or LinkedIn. Contact happens through the request the Forge
 * Manager assigns, the same way founder-to-student contact goes through
 * Concierge rather than a raw address.
 */
export function toAlumniMentorCard(mentor) {
  return {
    id: String(mentor.id),
    mentorId: mentor.id,
    name: mentor.name,
    initials: mentor.initials ?? initialsOf(mentor.name),
    tone: mentor.avatarTone ?? 'primary',
    role: mentor.roleTitle ?? 'Alumni Mentor',
    meta: joinMeta(
      mentor.graduationYear ? `Batch of ${mentor.graduationYear}` : null,
      mentor.city,
      mentor.experienceBand
    ),
    areas: mentor.areas.map((area) => area.name),
  }
}

export function toSession(session) {
  const status = SESSION_STATUS[session.status] ?? FALLBACK
  return {
    id: `session-${session.id}`,
    when: session.scheduledAt ? scheduleLabel(session.scheduledAt) : 'Pending Assignment',
    status: status.label,
    statusTone: status.tone,
    mentor: `Mentor: ${session.mentor?.name ?? 'TBD'}`,
    topic: session.topic ?? '',
  }
}

/** The single "Upcoming" card on mobile. */
export function toUpcomingSession(session, startupName) {
  if (!session) return null
  return {
    title: startupName ? `Startup Review — ${startupName}` : session.topic,
    when: scheduleLabel(session.scheduledAt),
  }
}

/* -------------------------------------------------------------------------- */
/* Incubation                                                                 */
/* -------------------------------------------------------------------------- */

export function toIncubationDraft(application, now = new Date()) {
  if (!application) return null
  const edited = application.submittedAt ?? application.createdAt
  return {
    id: application.id,
    title: `${application.ideaName} — ${INCUBATION_STATUS[application.status] ?? 'Draft'}`,
    meta: joinMeta(
      `Last edited ${agoLabel(edited, { now })}`,
      `${application.completionPct}% complete`
    ),
  }
}

/** The posted-needs cards, which reuse the concierge summary treatment. */
export function toPostedNeed(need) {
  const status =
    need.status === 'open'
      ? { label: 'Open', tone: 'info' }
      : need.status === 'filled'
        ? { label: 'Filled', tone: 'success' }
        : { label: 'Closed', tone: 'neutral' }

  return {
    id: `need-${need.id}`,
    title: need.startup?.name ?? need.title,
    detail: need.description ?? need.title,
    meta: `Posted ${agoLabel(need.postedAt)}`,
    status: status.label,
    tone: status.tone,
  }
}
