import 'server-only'

import { requireRoleOrRedirect } from '@/lib/auth/guard'
import { NotFoundError, ValidationError } from '@/lib/errors'
import {
  applicationsService,
  conciergeService,
  incubationService,
  listingsService,
  lookupsService,
  mentorshipService,
  platformService,
  startupsService,
  studentsService,
} from '@/lib/services'
import {
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  storeImage,
} from '@/lib/storage/uploads'
import * as present from './presenter'

/**
 * Screen assembly for the Founder module.
 *
 * Same shape as the Student module: Route Handlers and pages both call these
 * functions, everything reads through the service layer, and no repository or
 * SQL is reachable from here.
 *
 * Almost every founder screen needs the same two things first — who they are
 * and which startup they own — so `getContext` resolves that once and the
 * screen builders take it as an argument rather than re-fetching.
 */

/* -------------------------------------------------------------------------- */
/* Static navigation                                                          */
/* -------------------------------------------------------------------------- */

/**
 * The Contract Type options on Post a Job: paid engagements (including
 * academic credit) or an equity-style stake.
 *
 * Post a Job offers a fixed pair, and the control must never render empty, so
 * the labels live here. `contract_types` still owns storage — each slug below
 * is a real row (migration 003) and is what `listings.contract_type_id` points
 * at. That table is shared with Post a Collab and with every listing already
 * posted, so this form narrows to its own two by slug rather than the table
 * being edited to suit it, the same way the Student module narrows to
 * COLLAB_CONTRACT_SLUGS.
 */
const JOB_CONTRACT_TYPES = [
  { slug: 'paid-academic-credit', name: 'Paid Work / Academic Credit' },
  { slug: 'equity-cofounder', name: 'Equity / Revenue Share / Co-founder Role' },
]

/**
 * Lookups are cached for the life of the server process, so a server that was
 * already running when migration 003 landed still holds a `contract_types`
 * list without the two slugs above. Such a process would render an empty
 * control and, worse, silently resolve the slug to NULL on submit. Refreshing
 * the cache once on a miss repairs both without a restart; the flag keeps an
 * install that never ran the migration from re-reading every lookup on every
 * page view.
 */
let contractTypesRefreshed = false

async function jobContractTypes() {
  let rows = await lookupsService.getContractTypes()
  const missing = JOB_CONTRACT_TYPES.some((type) => !rows.some((row) => row.slug === type.slug))

  if (missing && !contractTypesRefreshed) {
    contractTypesRefreshed = true
    lookupsService.clearCache()
    rows = await lookupsService.getContractTypes()
  }

  // The stored label wins when the row is there; the constant keeps the
  // control populated if it is not.
  const bySlug = new Map(rows.map((row) => [row.slug, row]))
  return JOB_CONTRACT_TYPES.map((type) => ({
    slug: type.slug,
    name: bySlug.get(type.slug)?.name ?? type.name,
  }))
}

const QUICK_ACTIONS = [
  { label: 'Search Student Pool', href: '/founder/student-pool', primary: true },
  { label: 'Post a Job', href: '/founder/post-job' },
  { label: 'Request Mentorship', href: '/founder/mentorship' },
  { label: 'View My Listings', href: '/founder/listings' },
]

const MOBILE_ACTIONS = [
  { label: 'Post Job', href: '/founder/post-job', primary: true },
  { label: 'Search', href: '/founder/student-pool' },
  { label: 'My Startup', href: '/founder/startup' },
]

export const HIRING_TABS = ['Browse All Roles', 'My Listings', 'My Applications', 'Collabs']

const PROJECT_FILTERS = ['All', 'New This Month', 'Featured', 'Hiring']

const HIRING_STATUSES = ['Actively Hiring', 'Not Hiring']

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function requireFounderPage(returnTo) {
  const identity = await requireRoleOrRedirect('founder', returnTo)
  return {
    identity,
    user: identity.user,
    chromeUser: { name: identity.user.name, initials: identity.user.initials },
  }
}

/**
 * The founder, their startup and whether their Founder access was granted.
 *
 * Takes the user the guard already resolved rather than an id, so no screen
 * re-reads a record the request has in hand.
 *
 * A founder without a startup is a real state — the role can be granted before
 * the profile is filled in — so `startup` is nullable and every screen below
 * copes with that rather than assuming one exists.
 */
export async function getContext(user) {
  if (!user?.id) throw new NotFoundError('Founder')

  const [startup, grants] = await Promise.all([
    startupsService.getForOwner(user.id),
    incubationService.listGrants({ userId: user.id }),
  ])

  return {
    user,
    startup,
    startupId: startup?.id ?? null,
    hasGrant: grants.some((grant) => grant.isActive),
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getHome(user) {
  const context = await getContext(user)
  const userId = user.id

  const [listings, contacts, sessions, activity, members] = await Promise.all([
    listingsService.browse({ createdBy: userId }),
    conciergeService.contactStats({ founderId: userId }),
    mentorshipService.listSessions({ menteeId: userId }),
    platformService.listStartupActivity({ actorId: userId, startupId: context.startupId, limit: 3 }),
    context.startupId ? startupsService.getWithTeam(context.startup.slug) : null,
  ])

  const openRoles = listings.filter((listing) => listing.status === 'live').length

  return {
    profile: present.toProfile(context.user, context.startup, context.hasGrant),
    date: present.toHomeDate(),
    stats: present.toHomeStats({
      startup: context.startup,
      openRoles,
      contacts: contacts.total,
      sessions: sessions.length,
    }),
    mobileStats: present.toMobileHomeStats({
      startup: context.startup,
      teamSize: members?.members.length ?? 0,
      openRoles,
    }),
    activity: activity.map(present.toActivity),
    mobileActivity: activity.map(present.toMobileActivity),
    quickActions: QUICK_ACTIONS,
    mobileActions: MOBILE_ACTIONS,
  }
}

export async function getProfile(user) {
  const context = await getContext(user)
  return { profile: present.toProfile(context.user, context.startup, context.hasGrant) }
}

/**
 * Concierge / Search Student Pool.
 *
 * The pool is fetched unfiltered and the track tabs filter in the browser —
 * the whole pool is one small result set, and a round trip per tab click would
 * be slower than the filtering it replaces.
 */
export async function getConcierge(user) {
  const userId = user.id
  const [pool, contacts, skills] = await Promise.all([
    conciergeService.searchPool({}),
    conciergeService.listContacts({ founderId: userId }),
    lookupsService.getSkills(),
  ])

  const categories = [...new Set(skills.map((skill) => skill.category))]
  const students = pool.map(present.toPoolStudent)
  const tracks = categories.filter((category) =>
    students.some((student) => student.track === category)
  )

  return {
    students,
    filters: ['All', ...tracks, 'Available Now'],
    contactLog: contacts.slice(0, 2).map(present.toContactSummary),
  }
}

export async function getContactLog(user) {
  const userId = user.id
  const [contacts, stats] = await Promise.all([
    conciergeService.listContacts({ founderId: userId }),
    conciergeService.contactStats({ founderId: userId }),
  ])
  return { contacts: contacts.map(present.toContactRow), stats }
}

export async function getPostedNeeds(user) {
  const userId = user.id
  const needs = await conciergeService.listPostedNeeds({ founderId: userId })
  return { needs: needs.map(present.toPostedNeed) }
}

export async function getProjects(user) {
  const context = await getContext(user)
  const startups = await startupsService.listActive()

  const now = new Date()
  return {
    projects: startups.map((startup) =>
      present.toProject(startup, { ownStartupId: context.startupId, now })
    ),
    filters: PROJECT_FILTERS,
  }
}

export async function getStartup(user) {
  const context = await getContext(user)
  if (!context.startup) return { startup: null }

  const withTeam = await startupsService.getWithTeam(context.startup.slug)
  return { startup: present.toMyStartup(withTeam, withTeam.members) }
}

/**
 * Hiring.
 *
 * The four tabs in the reference had no behaviour behind them. Each now maps
 * to a real set, resolved server-side so the panel stays a pure renderer:
 * every live role, the founder's own listings, roles they have applied to
 * themselves, and live collabs.
 */
export async function getHiring(user) {
  const userId = user.id
  const [own, live, applications] = await Promise.all([
    listingsService.browse({ createdBy: userId }),
    listingsService.listLive(),
    applicationsService.listForUser(userId),
  ])

  const appliedListingIds = new Set(applications.map((application) => application.listing.id))

  const tabs = {
    'Browse All Roles': live.filter((listing) => listing.type === 'job'),
    'My Listings': own,
    'My Applications': live.filter((listing) => appliedListingIds.has(listing.id)),
    Collabs: live.filter((listing) => listing.type === 'collab'),
  }

  // Applicants are only ever shown for the founder's own listings, so only
  // those are fetched — one query per listing the founder actually posted,
  // run together rather than in sequence.
  const applicantLists = await Promise.all(
    own.map((listing) => applicationsService.listForListing(listing.id))
  )
  const applicantsByListing = Object.fromEntries(
    own.map((listing, index) => [
      String(listing.id),
      applicantLists[index].map(present.toApplicant),
    ])
  )

  return {
    tabs: HIRING_TABS,
    listingsByTab: Object.fromEntries(
      Object.entries(tabs).map(([tab, items]) => [tab, items.map(present.toListing)])
    ),
    applicantsByListing,
  }
}

/** The Applicants screen groups the founder's own listings with their applicants. */
export async function getApplicants(user) {
  const userId = user.id
  const own = await listingsService.browse({ createdBy: userId })
  const lists = await Promise.all(
    own.map((listing) => applicationsService.listForListing(listing.id))
  )

  return {
    listings: own.map((listing, index) => ({
      ...present.toListing(listing),
      applicants: lists[index].map(present.toApplicant),
    })),
  }
}

/**
 * The Mentorship screen: the founder's own mentor and sessions, plus the
 * alumni mentors they can ask for by name.
 *
 * `listAlumniDirectory` — never `listMentors`. The latter is the staff read
 * and carries alumni email, phone and LinkedIn; everything returned from here
 * is serialised into the page payload for a client component, so a field that
 * merely goes unrendered is still a field the browser receives.
 */
export async function getMentorship(user, { area = null } = {}) {
  const context = await getContext(user)
  const userId = user.id

  const [sessions, mentorTypes, primaryMentor, alumni, areas] = await Promise.all([
    mentorshipService.listSessions({ menteeId: userId }),
    lookupsService.getMentorTypes(),
    mentorshipService.getPrimaryMentor(),
    mentorshipService.listAlumniDirectory({ areaSlug: area }),
    lookupsService.getMentorshipAreas(),
  ])

  const assigned = sessions.find((session) => session.mentor)?.mentor ?? null
  const mentor = assigned
    ? { ...assigned, type: { name: assigned.typeName }, isPrimary: assigned.id === primaryMentor?.id }
    : primaryMentor

  const upcoming = sessions.find((session) => session.status === 'upcoming') ?? null

  return {
    mentor: present.toMentor(mentor),
    sessions: sessions.map(present.toSession),
    upcoming: present.toUpcomingSession(upcoming, context.startup?.name),
    mentorTypes: [
      ...mentorTypes.map((type) => ({ slug: type.slug, name: type.name })),
      { slug: null, name: 'No preference' },
    ],
    alumniMentors: alumni.map(present.toAlumniMentorCard),
    // Only the areas somebody actually covers: an empty filter is a dead end,
    // and three of the ten went unchosen by every alumnus in the intake.
    mentorshipAreas: areas
      .filter((item) => alumni.some((mentor) => mentor.areas.some((a) => a.slug === item.slug)))
      .map((item) => ({ slug: item.slug, name: item.name })),
  }
}

export async function getIncubation(user) {
  const userId = user.id
  const applications = await incubationService.listApplications({ applicantId: userId })
  return { draft: present.toIncubationDraft(applications[0] ?? null) }
}

/** Field options for Post a Job. */
export async function getJobFormOptions() {
  const [contractTypes, listingTypes] = await Promise.all([
    jobContractTypes(),
    lookupsService.getListingTypes(),
  ])

  return {
    contractTypes,
    listingTypes: listingTypes.map((type) => ({ slug: type.slug, name: type.name })),
  }
}

/**
 * Field options and current values for Edit Listing / Startup Profile Setup.
 *
 * Both routes render the same form; the only difference is whether a startup
 * already exists to prefill it from.
 */
export async function getStartupForm(user) {
  const context = await getContext(user)
  const userId = user.id

  const [industries, stages, readinessItems, applications] = await Promise.all([
    lookupsService.getIndustries(),
    lookupsService.getStages(),
    lookupsService.getReadinessItems(),
    incubationService.listApplications({ applicantId: userId }),
  ])

  const application = applications[0] ?? null
  const readiness = application ? await incubationService.getReadiness(application.id) : null

  return {
    industries: industries.map((industry) => ({ slug: industry.slug, name: industry.name })),
    stages: stages.map((stage) => ({ slug: stage.slug, name: stage.name })),
    hiringStatuses: HIRING_STATUSES,
    // The picker's `accept` list and the size it refuses at come from the
    // module that enforces them, so the form cannot drift from the server.
    logoUpload: {
      accept: ACCEPTED_IMAGE_MIME,
      formats: ACCEPTED_IMAGE_LABEL,
      maxBytes: MAX_IMAGE_BYTES,
    },
    readinessItems: readinessItems.map((item) => ({
      id: item.slug,
      label: item.name,
      hint: item.hint ?? '',
      placeholder: 'Paste link or add details...',
    })),
    // Prefilled so "Save Changes" cannot silently blank a field the founder
    // did not touch.
    values: context.startup
      ? {
          ...present.toMyStartup(context.startup, []).raw,
          readiness: Object.fromEntries(
            (readiness?.items ?? []).map((item) => [item.slug, item.value ?? ''])
          ),
        }
      : { readiness: {} },
  }
}

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

export async function contactStudent(user, input) {
  const context = await getContext(user)
  const userId = user.id

  const studentId = Number(input.studentId)
  if (!Number.isInteger(studentId) || studentId < 1) {
    throw new ValidationError('Choose a student to contact.')
  }

  const contactId = await conciergeService.contactStudent({
    founderId: userId,
    studentId,
    startupId: context.startupId,
    context: input.context?.trim() || `Outreach from ${context.startup?.name ?? context.user.name}`,
    durationLabel: input.duration?.trim() || null,
    message: input.message?.trim() || null,
  })
  return { contactId }
}

/**
 * Move a Concierge contact through pending → ongoing → done.
 *
 * The contact must be this founder's own outreach. Somebody else's reports 404
 * rather than 403 — confirming the id exists would leak who has contacted whom.
 */
export async function updateContactStatus(user, input) {
  const contactId = Number(input.contactId)
  if (!Number.isInteger(contactId) || contactId < 1) {
    throw new ValidationError('Choose a contact to update.')
  }

  const contacts = await conciergeService.listContacts({ founderId: user.id })
  const contact = contacts.find((row) => row.id === contactId)
  if (!contact) throw new NotFoundError('Contact')

  await conciergeService.updateContactStatus(contactId, input.status)
  return { contactId, status: input.status }
}

/** Post a talent need through Concierge. */
export async function postNeed(user, input) {
  const context = await getContext(user)

  const needId = await conciergeService.postNeed({
    founderId: user.id,
    startupId: context.startupId,
    title: input.title,
    description: input.description?.trim() || null,
  })
  return { needId }
}

export async function postJob(user, input) {
  const context = await getContext(user)
  const userId = user.id

  // Role type is a free-text field in the reference, so the value arrives as
  // a label ("Part-time") rather than a slug. Matching happens here, not in
  // the form: a client that sends the label must not silently store no type
  // at all, and the API has to behave the same however it is called.
  const [listingTypeSlug, contractTypeSlug, skills] = await Promise.all([
    resolveLookupSlug(lookupsService.getListingTypes, input.roleType),
    resolveLookupSlug(lookupsService.getContractTypes, input.contractType),
    resolveSkillNames(input.skills),
  ])

  const listingId = await listingsService.create(
    {
      type: 'job',
      title: input.title,
      description: input.description,
      startupId: context.startupId,
      listingTypeSlug,
      contractTypeSlug,
      compensation: input.compensation?.trim() || null,
      skillIds: skills.skillIds,
    },
    userId
  )
  return { listingId, unmatchedSkills: skills.unmatched }
}

/**
 * Save the startup profile — Edit Listing and Startup Profile Setup.
 *
 * Creates the startup when the founder does not have one yet and updates it
 * otherwise, so one endpoint serves both modes of the shared form. Readiness
 * evidence is written against the founder's incubation application, which is
 * where the Forge Manager reads it from.
 */
export async function saveStartupProfile(user, input) {
  const context = await getContext(user)
  const userId = user.id

  // `UPDATE_STARTUP` writes every column, so a request that omits a field must
  // not blank it. The form always sends all of them; a partial API call would
  // otherwise silently clear the tagline or the problem statement.
  const current = context.startup
  const payload = {
    name: input.name ?? current?.name,
    tagline: has(input, 'tagline') ? input.tagline?.trim() || null : (current?.tagline ?? null),
    problemStatement: has(input, 'problemStatement')
      ? input.problemStatement?.trim() || null
      : (current?.problemStatement ?? null),
    industrySlug: has(input, 'industrySlug')
      ? input.industrySlug || null
      : (current?.industry?.slug ?? null),
    stageSlug: has(input, 'stageSlug') ? input.stageSlug || null : (current?.stage?.slug ?? null),
    isHiring: has(input, 'isHiring') ? Boolean(input.isHiring) : Boolean(current?.isHiring),
    openRoles: has(input, 'openRoles')
      ? normaliseOpenRoles(input.openRoles)
      : (current?.openRoles ?? 0),
    logoUrl: has(input, 'logoUrl')
      ? normaliseLogoUrl(input.logoUrl)
      : (current?.logoUrl ?? null),
  }

  const startup = context.startup
    ? (await startupsService.updateListing(context.startupId, payload, userId), context.startup)
    : await startupsService.createForOwner(payload, userId)

  const applications = await incubationService.listApplications({ applicantId: userId })
  if (applications[0] && input.readiness) {
    await incubationService.saveReadiness({
      applicationId: applications[0].id,
      readiness: input.readiness,
    })
  }

  return { startupId: startup.id, created: !context.startup }
}

/**
 * Store a logo chosen on Edit Listing and hand back the URL it will load from.
 *
 * Nothing is written to `startups` here — `saveStartupProfile` does that when
 * the founder saves, with the URL this returned. Keeping the two apart is what
 * lets the same field work in Startup Profile Setup, where the row the column
 * belongs to does not exist yet.
 */
export async function uploadStartupLogo(user, file) {
  if (!user?.id) throw new NotFoundError('Founder')

  const stored = await storeImage(file, 'startup-logos')
  return { logoUrl: stored.url, bytes: stored.bytes }
}

export async function requestMentorship(user, input) {
  const context = await getContext(user)
  const userId = user.id

  const requestId = await mentorshipService.requestSession({
    requesterId: userId,
    startupId: context.startupId,
    topic: input.topic,
    context: input.context?.trim() || null,
    preferredMentorTypeSlug: input.mentorType || null,
    preferredTiming: input.timing?.trim() || null,
  })
  return { requestId }
}

/**
 * Move an applicant through the hiring pipeline.
 *
 * The founder must own the listing the application belongs to. That is checked
 * against `listing.createdBy`, not against the startup: a listing is owned by
 * whoever posted it, and two founders can share a startup.
 *
 * A listing that is not theirs reports 404 rather than 403 — confirming that an
 * application id exists would leak who has applied where.
 */
export async function decideApplicant(user, input) {
  const applicationId = Number(input.applicationId)
  if (!Number.isInteger(applicationId) || applicationId < 1) {
    throw new ValidationError('Choose an application to update.')
  }

  const application = await applicationsService.getById(applicationId)
  if (!application) throw new NotFoundError('Application')

  const listing = await listingsService.getById(application.listing.id)
  if (!listing || listing.createdBy?.id !== user.id) throw new NotFoundError('Application')

  // Withdrawal belongs to the applicant, not to the founder reviewing them.
  if (input.status === 'withdrawn') {
    throw new ValidationError('Only the applicant can withdraw an application.')
  }

  const updated = await applicationsService.changeStatus({
    applicationId,
    status: input.status,
    actorId: user.id,
    note: input.note?.trim() || null,
  })

  return { applicationId, status: updated.status }
}

export async function saveProfile(user, input) {
  const userId = user.id
  if (!input?.name?.trim()) throw new ValidationError('Your name is required.')
  if (!input?.email?.trim()) throw new ValidationError('Your email is required.')

  await studentsService.updateProfile(userId, {
    name: input.name.trim(),
    email: input.email.trim(),
    bio: input.bio?.trim() || null,
  })
  return { saved: true }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** True when the caller actually sent the field, as opposed to leaving it out. */
const has = (input, key) => Object.hasOwn(input ?? {}, key)

function normaliseOpenRoles(value) {
  if (value === null || value === undefined || value === '') return 0
  const roles = Number.parseInt(value, 10)
  if (!Number.isInteger(roles) || roles < 0 || roles > 99) {
    throw new ValidationError('Open roles must be a whole number between 0 and 99.')
  }
  return roles
}

/**
 * Keeps `startups.logo_url` to URLs this application actually issued.
 *
 * The column is read straight into an `<img src>` on pages other people look
 * at, so an arbitrary string here would be a founder-controlled URL on someone
 * else's screen — an off-site tracker at best. `storeImage` only ever returns
 * `/uploads/startup-logos/<sha256>.<ext>`, so anything else was not produced by
 * the upload endpoint and is refused. An empty value clears the logo.
 */
const LOGO_URL_PATTERN = /^\/uploads\/startup-logos\/[a-f0-9]{64}\.[a-z]{3,4}$/

function normaliseLogoUrl(value) {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string' || !LOGO_URL_PATTERN.test(value)) {
    throw new ValidationError('That logo could not be attached. Upload the image again.', {
      fields: { logoUrl: 'Not an uploaded image.' },
    })
  }
  return value
}

/**
 * Accepts either a lookup slug or its display label, case-insensitively.
 *
 * Forms that use a segmented control send slugs; free-text fields send what
 * the founder typed. Both resolve to the same row rather than one of them
 * quietly resolving to nothing.
 */
async function resolveLookupSlug(loader, value) {
  const typed = String(value ?? '').trim().toLowerCase()
  if (!typed) return null

  const options = await loader()
  const match =
    options.find((option) => option.slug.toLowerCase() === typed) ??
    options.find((option) => option.name.toLowerCase() === typed)
  return match?.slug ?? null
}

/** Matches free-typed skill names against the catalogue — see the Student module. */
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
