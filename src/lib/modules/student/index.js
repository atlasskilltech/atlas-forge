import 'server-only'

import { requireRoleOrRedirect } from '@/lib/auth/guard'
import { NotFoundError, ValidationError } from '@/lib/errors'
import {
  applicationsService,
  incubationService,
  listingsService,
  lookupsService,
  mentorshipService,
  platformService,
  startupsService,
  studentsService,
} from '@/lib/services'
import * as present from './presenter'

/**
 * Screen assembly for the Student module.
 *
 * Route Handlers and the Student pages both call these functions, so a screen
 * is composed once and cannot drift between its server-rendered form and its
 * API form. Everything below reads through the service layer — no repository
 * or SQL is reachable from here.
 *
 * Fan-out reads run through `Promise.all` rather than sequential awaits: the
 * home screen needs four independent result sets, and serialising them would
 * cost four round trips where one is enough.
 */

/* -------------------------------------------------------------------------- */
/* Static navigation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Quick actions are navigation, not content — they name routes that exist in
 * this build, so they stay in code rather than becoming database rows an
 * administrator could point at a 404.
 */
const QUICK_ACTIONS = [
  { label: 'Flag Availability', href: '/student/availability', primary: true },
  { label: 'Browse Jobs', href: '/student/jobs' },
  { label: 'Browse Projects', href: '/student/projects' },
  { label: 'Request Mentorship', href: '/student/mentorship' },
]

const MOBILE_ACTIONS = [
  { icon: '💼', label: 'Browse Jobs', href: '/student/jobs' },
  { icon: '🚀', label: 'Browse Projects', href: '/student/projects' },
  { icon: '📝', label: 'Flag Availability', href: '/student/availability' },
]

/**
 * The engagement options on Post a Collab. A collab is unpaid, revenue-shared
 * or lightly paid — "Paid Freelance" belongs to a founder's job listing, not a
 * student's collab post, so the three relevant contract types are selected by
 * slug and their labels still come from the database.
 */
const COLLAB_CONTRACT_SLUGS = ['no-pay', 'equity', 'part-time-paid']

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The guard every Student page runs first.
 *
 * Returns the identity plus the signed-in user in the shape the app chrome
 * takes, so a page never has to reshape it. An anonymous visitor is sent to
 * the login screen; somebody without the student role is sent to role select.
 */
export async function requireStudentPage(returnTo) {
  const identity = await requireRoleOrRedirect('student', returnTo)
  return {
    identity,
    userId: identity.user.id,
    chromeUser: { name: identity.user.name, initials: identity.user.initials },
  }
}

/* -------------------------------------------------------------------------- */
/* Shared counters                                                            */
/* -------------------------------------------------------------------------- */

/**
 * The numbers behind the stat cards on Home and My Profile.
 *
 * "Projects Exploring" counts the distinct startups the student has an
 * application with — the mock's flat `3` had no definition behind it.
 */
async function getCounters(userId) {
  const [profile, applications, sessions] = await Promise.all([
    studentsService.getProfile(userId),
    applicationsService.listForUser(userId),
    mentorshipService.listSessions({ menteeId: userId }),
  ])

  const open = applications.filter(present.isOpenApplication)
  const startupIds = new Set(
    applications.map((application) => application.startup?.id).filter(Boolean)
  )

  return {
    profile,
    applications,
    sessions,
    openApplications: open.length,
    projectsExploring: startupIds.size,
    upcomingSessions: sessions.filter((session) => session.status === 'upcoming').length,
    isAvailable: profile.isAvailable,
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getHome(userId) {
  const [counters, activity] = await Promise.all([
    getCounters(userId),
    platformService.listActivity({ actorId: userId, limit: 3 }),
  ])

  return {
    profile: present.toProfile(counters.profile),
    stats: present.toHomeStats(counters),
    mobileStats: present.toMobileHomeStats(counters),
    activity: activity.map(present.toActivity),
    quickActions: QUICK_ACTIONS,
    mobileActions: MOBILE_ACTIONS,
  }
}

export async function getProfile(userId) {
  const counters = await getCounters(userId)
  return {
    profile: present.toProfile(counters.profile),
    stats: present.toProfileStats(counters),
  }
}

/** Flag My Availability / My Skills Profile — the same screen, two entry points. */
export async function getAvailability(userId) {
  const [profile, skills] = await Promise.all([
    studentsService.getProfile(userId),
    lookupsService.getSkills(),
  ])
  return {
    profile: present.toProfile(profile),
    allSkills: skills.map((skill) => ({ id: skill.id, name: skill.name, category: skill.category })),
  }
}

/**
 * Browse Jobs & Collabs.
 *
 * Filter tabs are built from the listing types actually present in the live
 * set, ordered by the lookup's own sort order. Offering a tab that can only
 * ever return an empty list is worse than not offering it.
 */
export async function getJobs(userId) {
  const [listings, applications, listingTypes] = await Promise.all([
    listingsService.listLive(),
    applicationsService.listForUser(userId),
    lookupsService.getListingTypes(),
  ])

  const appliedTo = new Set(applications.map((application) => application.listing.id))
  const jobs = listings.map((listing) => present.toJob(listing, appliedTo))

  const present_ = new Set(jobs.map((job) => job.type))
  const filters = ['All', ...listingTypes.map((type) => type.name).filter((name) => present_.has(name))]

  return { jobs, filters }
}

export async function getApplications(userId) {
  const applications = await applicationsService.listForUser(userId)
  return { applications: applications.map(present.toApplication) }
}

export async function getProjects() {
  const [startups, industries] = await Promise.all([
    startupsService.listActive(),
    lookupsService.getIndustries(),
  ])

  const now = new Date()
  const projects = startups.map((startup) => present.toProject(startup, { now }))

  const sectors = new Set(projects.map((project) => project.sector))
  const filters = [
    'All',
    ...industries.map((industry) => industry.name).filter((name) => sectors.has(name)),
    'Actively Hiring',
    'New This Month',
  ]

  return { projects, filters }
}

export async function getMentorship(userId) {
  const [sessions, mentorTypes, primaryMentor] = await Promise.all([
    mentorshipService.listSessions({ menteeId: userId }),
    lookupsService.getMentorTypes(),
    mentorshipService.getPrimaryMentor(),
  ])

  // The mentor drawn on the mobile card is whoever is actually assigned to this
  // student; the Forge Manager is the fallback while nobody is.
  const assigned = sessions.find((session) => session.mentor)?.mentor ?? null
  const mentor = assigned
    ? { ...assigned, type: { name: assigned.typeName }, isPrimary: assigned.id === primaryMentor?.id }
    : primaryMentor

  return {
    sessions: sessions.map(present.toSession),
    assignedMentor: present.toAssignedMentor(mentor),
    mentorTypes: [...mentorTypes.map((type) => ({ slug: type.slug, name: type.name })),
      { slug: null, name: 'No preference' }],
  }
}

export async function getIncubation(userId) {
  const [stages, readinessItems, existing] = await Promise.all([
    lookupsService.getStages(),
    lookupsService.getReadinessItems(),
    incubationService.listApplications({ applicantId: userId }),
  ])

  return {
    stages: stages.map((stage) => ({ slug: stage.slug, name: stage.name })),
    readinessItems: readinessItems.map(present.toReadinessItem),
    // Surfaced so the form can tell the student they already have one in review.
    submitted: existing.map((application) => ({
      id: application.id,
      ideaName: application.ideaName,
      status: application.status,
      completionPct: application.completionPct,
    })),
  }
}

export async function getCollabOptions() {
  const contractTypes = await lookupsService.getContractTypes()
  const bySlug = new Map(contractTypes.map((type) => [type.slug, type]))
  return {
    engagementTypes: COLLAB_CONTRACT_SLUGS.map((slug) => bySlug.get(slug))
      .filter(Boolean)
      .map((type) => ({ slug: type.slug, name: type.name })),
  }
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function applyToListing(userId, listingId) {
  const id = Number(listingId)
  if (!Number.isInteger(id) || id < 1) throw new ValidationError('Choose a role to apply for.')

  const applicationId = await applicationsService.apply({ listingId: id, applicantId: userId })
  return { applicationId }
}

export async function withdrawApplication(userId, applicationId) {
  const application = await applicationsService.getById(Number(applicationId))
  if (!application) throw new NotFoundError('Application')
  // A student may only withdraw their own application.
  if (application.applicant.id !== userId) throw new NotFoundError('Application')

  await applicationsService.withdraw(application.id, userId)
  return { withdrawn: true }
}

export async function saveAvailability(userId, input) {
  const hours = input.hoursPerWeek === null || input.hoursPerWeek === undefined || input.hoursPerWeek === ''
    ? null
    : Number(input.hoursPerWeek)

  if (hours !== null && (!Number.isFinite(hours) || hours < 0 || hours > 80)) {
    throw new ValidationError('Hours per week must be between 0 and 80.')
  }

  await studentsService.updateAvailability(userId, {
    isAvailable: Boolean(input.isAvailable),
    hoursPerWeek: hours,
    workTypes: input.workTypes?.trim() || null,
    availabilityTiming: input.timing?.trim() || null,
  })
  return { saved: true }
}

export async function saveSkills(userId, skillIds) {
  if (!Array.isArray(skillIds)) throw new ValidationError('Send skills as a list.')

  const ids = skillIds.map(Number).filter((id) => Number.isInteger(id) && id > 0)
  const known = new Set((await lookupsService.getSkills()).map((skill) => skill.id))
  const unknown = ids.filter((id) => !known.has(id))
  if (unknown.length > 0) throw new ValidationError('One or more skills are not recognised.')

  await studentsService.updateSkills(userId, [...new Set(ids)])
  return { saved: true }
}

export async function saveProfile(userId, input) {
  if (!input?.name?.trim()) throw new ValidationError('Your name is required.')
  if (!input?.email?.trim()) throw new ValidationError('Your email is required.')

  await studentsService.updateProfile(userId, {
    name: input.name.trim(),
    email: input.email.trim(),
    bio: input.bio?.trim() || null,
  })
  return { saved: true }
}

export async function requestMentorship(userId, input) {
  const requestId = await mentorshipService.requestSession({
    requesterId: userId,
    topic: input.topic,
    context: input.context?.trim() || null,
    preferredMentorTypeSlug: input.mentorType || null,
    preferredTiming: input.timing?.trim() || null,
  })
  return { requestId }
}

/**
 * Matches free-typed skill names against the skills lookup, case-insensitively.
 *
 * The collab form asks for skills as comma-separated text, so names that are
 * not in the catalogue cannot become `listing_skills` rows. They are returned
 * as `unmatched` rather than dropped in silence, so the caller can say so.
 */
async function resolveSkillNames(text) {
  if (!text?.trim()) return { skillIds: [], unmatched: [] }

  const catalogue = await lookupsService.getSkills()
  const byName = new Map(catalogue.map((skill) => [skill.name.toLowerCase(), skill.id]))

  const skillIds = []
  const unmatched = []
  for (const raw of text.split(',')) {
    const name = raw.trim()
    if (!name) continue
    const id = byName.get(name.toLowerCase())
    if (id) skillIds.push(id)
    else unmatched.push(name)
  }

  return { skillIds: [...new Set(skillIds)], unmatched }
}

/**
 * Post a Collab.
 *
 * Always created as type `collab`, whatever the client sends — a student
 * cannot use this endpoint to publish a founder's job listing. Whether it
 * needs approval is decided by platform settings inside the service.
 */
export async function postCollab(userId, input) {
  const { skillIds, unmatched } = await resolveSkillNames(input.skills)

  const listingId = await listingsService.create(
    {
      type: 'collab',
      title: input.title,
      description: input.summary,
      collaboratorNeed: input.collaborator?.trim() || null,
      listingTypeSlug: 'collab',
      contractTypeSlug: input.engagement || null,
      skillIds,
    },
    userId
  )
  return { listingId, unmatchedSkills: unmatched }
}

export async function submitIncubation(userId, input) {
  const applicationId = await incubationService.submit({
    applicantId: userId,
    ideaName: input.ideaName,
    problemStatement: input.problem?.trim() || null,
    stageSlug: input.stage || null,
    teamMemberIds: input.team?.trim() || null,
    readiness: input.readiness ?? {},
    asDraft: Boolean(input.asDraft),
  })
  return { applicationId }
}
