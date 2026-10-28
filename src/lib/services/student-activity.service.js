import 'server-only'

import { REGISTRATION_ROLE_LABEL } from '@/config/registration'
import { ConflictError, NotFoundError } from '@/lib/errors'
import * as repo from '@/lib/repositories/student-activity.repository'

/**
 * Student Activity API service.
 *
 * Resolves a UNIVERSITY Student Application ID to the one Atlas Student behind
 * it and assembles a read-only view of everything the database genuinely
 * records for them, split into three parts the caller can rely on:
 *
 *   currentState — the authoritative snapshot right now (registration, account,
 *                  roles, incubation, startups, founder access).
 *   activity     — dated events, newest first: milestones derived from real
 *                  relational timestamps plus the audit-log entries. Nothing is
 *                  synthesised; an event exists only if a row with that date does.
 *   meta         — counts, pagination and an honest statement of coverage.
 *
 * It never combines two students: more than one registration for the same ID is
 * an ambiguity the caller must resolve, not something to merge.
 */

const INCUBATION_STATUS_LABELS = Object.freeze({
  draft: 'Draft',
  pending: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
})

/** Push an event only when it has a real timestamp. */
function addEvent(events, at, type, category, description, status = null) {
  if (!at) return
  // `seq` is the build order — used ONLY as a deterministic tiebreaker for
  // events that share a timestamp, and stripped before the events are returned.
  events.push({ seq: events.length, at, type, category, description, status })
}

function buildActivity({ registration, bundle, audit }) {
  const events = []

  // 1 · Registration milestones (the public submit is not audit-logged, so the
  //     submission event comes from the row's own timestamp).
  addEvent(events, registration.createdAt, 'registration.submitted', 'registration', `Registration ${registration.reference} submitted.`, 'pending')
  if (registration.reviewedAt && registration.status !== 'pending') {
    addEvent(
      events,
      registration.reviewedAt,
      `registration.${registration.status}`,
      'registration',
      registration.status === 'rejected'
        ? `Registration ${registration.reference} rejected.`
        : `Registration ${registration.reference} approved.`,
      registration.status === 'rejected' ? 'failed' : 'success'
    )
  }

  const { account, roles, incubation, startups, grants } = bundle

  // 2 · Account created.
  if (account) {
    addEvent(events, account.createdAt, 'account.created', 'account', `ATLAS Forge account ${account.appId} created.`, 'success')
  }

  // 3 · Role grants / revocations.
  for (const role of roles) {
    addEvent(events, role.grantedAt, 'role.granted', 'account', `Role "${role.name}" granted.`, 'success')
    addEvent(events, role.revokedAt, 'role.revoked', 'account', `Role "${role.name}" revoked.`, 'action')
  }

  // 4 · Incubation application milestones.
  for (const app of incubation) {
    addEvent(events, app.submittedAt, 'incubation.submitted', 'incubation', `Incubation application "${app.ideaName}" submitted.`, 'pending')
    if (app.reviewedAt) {
      addEvent(events, app.reviewedAt, `incubation.${app.status}`, 'incubation', `Incubation application "${app.ideaName}" ${app.status.replace('_', ' ')}.`, app.status === 'rejected' ? 'failed' : 'success')
    }
  }

  // 5 · Startup memberships joined.
  for (const startup of startups) {
    if (startup.relationship === 'member') {
      addEvent(events, startup.joinedAt ?? startup.createdAt, 'startup.joined', 'startup', `Joined startup "${startup.name}" as ${startup.roleTitle ?? 'member'}.`, 'success')
    }
  }

  // 6 · Founder access grants / revocations.
  for (const grant of grants) {
    addEvent(events, grant.grantedAt, 'founder_access.granted', 'founder', 'Founder access granted.', 'success')
    addEvent(events, grant.revokedAt, 'founder_access.revoked', 'founder', 'Founder access revoked.', 'action')
  }

  // 7 · Audit-log entries. Registration-entity rows are skipped: the decision
  //     above already reports that same event from the authoritative row, so
  //     including them here would double-count it.
  for (const entry of audit) {
    if (entry.entityType === 'registration_request') continue
    addEvent(events, entry.createdAt, 'audit', entry.module, entry.action, entry.status)
  }

  // Newest first. Equal timestamps fall back to build order (later-built event
  // first) — a deterministic secondary key, so a given dataset always paginates
  // identically with no event duplicated or skipped between pages. `seq` is
  // internal and is dropped from the returned events.
  events.sort((a, b) => (a.at === b.at ? b.seq - a.seq : a.at < b.at ? 1 : -1))
  return events.map(({ at, type, category, description, status }) => ({
    at,
    type,
    category,
    description,
    status,
  }))
}

function buildCurrentState({ registration, bundle }) {
  const { account, roles, incubation, startups, grants } = bundle
  const latestIncubation = incubation.length ? incubation[incubation.length - 1] : null
  const activeGrant = grants.find((g) => !g.revokedAt) ?? null

  return {
    registration: {
      reference: registration.reference,
      status: registration.status,
      submittedAt: registration.createdAt,
      reviewedAt: registration.reviewedAt,
      rejectionReason: registration.status === 'rejected' ? registration.rejectionReason : null,
    },
    account: account
      ? {
          exists: true,
          forgeAppId: account.appId,
          status: account.status,
          active: account.status === 'active' && !account.isDeleted,
          createdAt: account.createdAt,
          lastActiveAt: account.lastActiveAt,
        }
      : { exists: false },
    roles: roles
      .filter((role) => !role.revokedAt)
      .map((role) => ({ slug: role.slug, name: role.name, isPrimary: role.isPrimary })),
    incubation: {
      hasApplication: incubation.length > 0,
      applicationCount: incubation.length,
      latest: latestIncubation
        ? {
            ideaName: latestIncubation.ideaName,
            status: latestIncubation.status,
            statusLabel: INCUBATION_STATUS_LABELS[latestIncubation.status] ?? latestIncubation.status,
            completionPct: latestIncubation.completionPct,
            submittedAt: latestIncubation.submittedAt,
            reviewedAt: latestIncubation.reviewedAt,
          }
        : null,
    },
    startups: startups.map((s) => ({
      name: s.name,
      relationship: s.relationship,
      status: s.status,
      roleTitle: s.roleTitle ?? null,
    })),
    founderAccess: { active: Boolean(activeGrant), activeSince: activeGrant?.grantedAt ?? null },
  }
}

/**
 * @param {{ applicationId: string, page: number, perPage: number }} args
 * @returns {Promise<{ student, currentState, activity, meta }>}
 * @throws {NotFoundError} no Atlas Student has this Application ID
 * @throws {ConflictError} more than one does
 */
export async function getStudentActivity({ applicationId, page = 1, perPage = 50 }) {
  const matches = await repo.findRegistrationsByApplicationId(applicationId)

  if (matches.length === 0) {
    throw new NotFoundError('No Atlas Student registration matches that Application ID')
  }
  if (matches.length > 1) {
    throw new ConflictError(
      'This Application ID is present on more than one student registration; it cannot be resolved to a single student safely.'
    )
  }

  const registration = matches[0]
  const bundle = await repo.findAccountBundle(registration.approvedUserId)
  const audit = await repo.findAuditForStudent({
    registrationId: registration.id,
    userId: registration.approvedUserId,
  })

  const student = {
    applicationId: registration.studentApplicationId,
    registrationReference: registration.reference,
    forgeAppId: bundle.account?.appId ?? null,
    name: bundle.account?.name ?? null,
    category: registration.roleCategory,
    categoryLabel: REGISTRATION_ROLE_LABEL[registration.roleCategory] ?? registration.roleCategory,
  }

  const allEvents = buildActivity({ registration, bundle, audit })
  const activityCount = allEvents.length
  const totalPages = activityCount === 0 ? 0 : Math.ceil(activityCount / perPage)
  const activity = allEvents.slice((page - 1) * perPage, (page - 1) * perPage + perPage)

  const currentState = buildCurrentState({ registration, bundle })

  return {
    student,
    currentState,
    activity,
    meta: {
      activityCount,
      returned: activity.length,
      page,
      perPage,
      totalPages,
      historyCoverage: 'available-records-only',
      notes: [
        'Activity is built from dated relational records plus the activity_logs audit trail; the application keeps no separate per-student event timeline.',
        'Account status, role set, startup and founder-access states reflect current values; the system does not record a history of status transitions beyond what appears in activity_logs.',
      ],
    },
  }
}
