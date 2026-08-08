import 'server-only'

import { requireRoleOrRedirect } from '@/lib/auth/guard'
import { ValidationError } from '@/lib/errors'
import {
  conciergeService,
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
 * Screen assembly for the Forge Manager module.
 *
 * Same shape as the Student and Founder modules: Route Handlers and pages both
 * call these functions, everything reads through the service layer, and no
 * repository or SQL is reachable from here.
 *
 * This is the module where the other two converge — the listings a founder
 * posts and the mentorship a student requests arrive here for a decision, and
 * those decisions are written with `roleSlug: 'forge-manager'` so a Backend
 * Manager override can later sit alongside them rather than replacing them.
 */

const MOBILE_QUICK_ACTIONS = [
  { label: 'Review Queue', href: '/forge/approval-queue', primary: true },
  { label: 'Student Pool', href: '/forge/student-pool' },
  { label: 'Assign Mentor', href: '/forge/assign-mentors' },
]

const LISTING_FILTERS = ['All', 'Live', 'Pending Approval', 'Rejected', 'Job Listing', 'Collab Post']
const USER_FILTERS = ['All', 'Students', 'Founders', 'Managers']
const PROJECT_BEHAVIOUR_FILTERS = ['Hiring', 'Featured']

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function requireForgePage(returnTo) {
  const identity = await requireRoleOrRedirect('forge-manager', returnTo)
  return {
    identity,
    user: identity.user,
    chromeUser: { name: identity.user.name, initials: identity.user.initials },
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getDashboard() {
  const [stats, queue, requests, contacts] = await Promise.all([
    platformService.stats(),
    listingsService.browse({ status: 'pending' }),
    mentorshipService.listRequests({ status: 'requested' }),
    conciergeService.listContacts({}),
  ])

  // The panel is a preview of two queues at once — listings awaiting a
  // decision and mentorship requests awaiting a mentor — newest first.
  const previews = [
    ...queue.map((listing) => ({ at: listing.postedAt ?? listing.createdAt, row: present.toQueueEntry(listing) })),
    ...requests.map((request) => ({ at: request.createdAt, row: present.toQueueRequest(request) })),
  ]
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 4)
    .map((entry) => entry.row)

  return {
    stats: present.toDashboardStats(stats),
    mobileStats: present.toMobileDashboardStats(stats),
    queue: previews,
    contacts: contacts.slice(0, 3).map(present.toDashboardContact),
    mobilePending: queue.slice(0, 2).map(present.toMobilePending),
    quickActions: MOBILE_QUICK_ACTIONS,
  }
}

export async function getApprovalQueue() {
  const listings = await listingsService.getApprovalQueue({})
  const items = listings.map(present.toApprovalItem)
  return { items, tabs: present.toApprovalTabs(items) }
}

export async function getStudentPool() {
  const [pool, skills] = await Promise.all([
    studentsService.getPool({}),
    lookupsService.getSkills(),
  ])

  const students = pool.map(present.toPoolStudent)
  const categories = [...new Set(skills.map((skill) => skill.category))]
  const tracks = categories.filter((category) =>
    students.some((student) => student.track === category)
  )

  return { students, filters: ['All', ...tracks, 'Available Now'], total: students.length }
}

/**
 * Assign Mentors.
 *
 * A request counts as handled once a session for it has a mentor, which is
 * what `assignMentor` writes — so the screen reflects assignments made here
 * without needing a second status column to keep in step.
 */
export async function getMentorship() {
  const [requests, mentors, sessions] = await Promise.all([
    mentorshipService.listRequests({}),
    mentorshipService.listMentors(),
    mentorshipService.listSessions({}),
  ])

  // Keyed by request, not by student: a student can have several requests, and
  // one of them being matched says nothing about the others.
  const assignedByRequest = new Map()
  for (const session of sessions) {
    if (session.mentor && session.requestId) assignedByRequest.set(session.requestId, session)
  }

  const open = requests.filter((request) => request.status === 'requested')

  return {
    requests: open.map(present.toMentorRequest),
    mentors: mentors.map(present.toMentorOption),
    sessionLog: sessions.map(present.toSessionLogEntry),
    mobileAssignments: requests.map((request) =>
      present.toMobileAssignment(request, assignedByRequest.get(request.id))
    ),
  }
}

export async function getIncubation() {
  const [applications, grants] = await Promise.all([
    incubationService.listApplications({}),
    incubationService.listGrants({}),
  ])

  const grantedUserIds = new Set(
    grants.filter((grant) => grant.isActive).map((grant) => grant.user.id)
  )

  return {
    applications: applications.map((application) =>
      present.toIncubationApplication(application, grantedUserIds.has(application.applicant.id))
    ),
  }
}

export async function getListings() {
  const listings = await listingsService.browse({})
  const rows = listings.map(present.toListingRow)
  return { rows, filters: LISTING_FILTERS, counts: present.toListingCounts(rows) }
}

export async function getProjects() {
  const [startups, industries] = await Promise.all([
    startupsService.list({}),
    lookupsService.getIndustries(),
  ])

  const projects = startups.map(present.toProject)
  const sectors = new Set(projects.map((project) => project.sector))

  return {
    projects,
    filters: [
      'All',
      ...industries.map((industry) => industry.name).filter((name) => sectors.has(name)),
      ...PROJECT_BEHAVIOUR_FILTERS,
    ],
  }
}

export async function getContacts() {
  const [contacts, stats] = await Promise.all([
    conciergeService.listContacts({}),
    conciergeService.contactStats({}),
  ])
  return { rows: contacts.map(present.toContactRow), stats: present.toContactStats(stats), total: stats.total }
}

/** The Contract Log — engagements actually agreed, not the outreach before them. */
export async function getContracts() {
  const contracts = await platformService.listContracts({})
  return { rows: contracts.map(present.toContractRow), stats: present.toContractStats(contracts) }
}

export async function getPostedNeeds() {
  const needs = await conciergeService.listPostedNeeds({})
  return { needs: needs.map(present.toPostedNeed) }
}

export async function getPlatformLogs(page = null) {
  const [activity, total] = await Promise.all([
    platformService.listActivity({ limit: page?.limit ?? 50, offset: page?.offset ?? null }),
    platformService.countActivity({}),
  ])
  return { logs: activity.map(present.toPlatformLog), total }
}

export async function getUsers() {
  const users = await studentsService.listAll()
  return { accounts: users.map(present.toUserAccount), filters: USER_FILTERS }
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Approve or reject a listing, as the Forge Manager.
 *
 * `roleSlug` is fixed here rather than taken from the body: this endpoint is
 * the Forge Manager's decision, and a Backend Manager override belongs to the
 * Backend module with its own audit trail.
 */
export async function decideListing(user, input) {
  const listingId = Number(input.listingId)
  if (!Number.isInteger(listingId) || listingId < 1) {
    throw new ValidationError('Choose a listing to decide on.')
  }

  await listingsService.decide({
    listingId,
    decision: input.decision,
    roleSlug: 'forge-manager',
    actorId: user.id,
    reason: input.reason?.trim() || null,
  })
  return { listingId, decision: input.decision }
}

export async function assignMentor(user, input) {
  const requestId = Number(input.requestId)
  const mentorId = Number(input.mentorId)
  if (!Number.isInteger(requestId) || !Number.isInteger(mentorId)) {
    throw new ValidationError('Choose a request and a mentor.')
  }

  await mentorshipService.assignMentor({
    requestId,
    mentorId,
    scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
    actorId: user.id,
  })
  return { requestId, mentorId }
}

export async function grantFounderAccess(user, input) {
  const applicationId = Number(input.applicationId)
  if (!Number.isInteger(applicationId) || applicationId < 1) {
    throw new ValidationError('Choose an application to approve.')
  }

  await incubationService.grantFounderAccess({
    applicationId,
    actorId: user.id,
    reason: input.reason?.trim() || null,
  })
  return { applicationId, granted: true }
}

export async function setFeatured(user, input) {
  const startupId = Number(input.startupId)
  if (!Number.isInteger(startupId) || startupId < 1) {
    throw new ValidationError('Choose a startup to feature.')
  }

  await startupsService.setFeatured(startupId, Boolean(input.featured), user.id)
  return { startupId, featured: Boolean(input.featured) }
}
