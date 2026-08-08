import 'server-only'

import { transaction } from '@/lib/db'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import * as incubation from '@/lib/repositories/incubation.repository'
import * as platform from '@/lib/repositories/platform.repository'
import * as users from '@/lib/repositories/users.repository'
import { getReadinessItems, getRoleBySlug, getStages, resolveId } from './lookups.service'

export const listApplications = (filters) => incubation.findApplications(filters)
export const getApplication = (id) => incubation.findApplicationById(id)
export const getReadiness = (id) => incubation.findReadiness(id)
export const listGrants = (filters) => incubation.findGrants(filters)
export const countPending = () => incubation.countPending()

/** Application plus its readiness checklist — what the form screen needs. */
export async function getApplicationWithReadiness(id) {
  const application = await incubation.findApplicationById(id)
  if (!application) throw new NotFoundError('Incubation application')
  const readiness = await incubation.findReadiness(id)
  return { ...application, readiness }
}

/**
 * Submit (or save a draft of) an incubation application.
 *
 * `completion_pct` is derived from the readiness rows rather than trusted from
 * the client, so the stored percentage always matches the stored evidence.
 */
export async function submit({
  applicantId,
  startupId = null,
  ideaName,
  problemStatement = null,
  stageSlug = null,
  teamMemberIds = null,
  readiness = {},
  asDraft = false,
}) {
  if (!ideaName?.trim()) throw new ValidationError('An idea or project name is required.')

  const stageId = await resolveId(getStages, stageSlug)
  const items = await getReadinessItems()

  const filled = items.filter((item) => String(readiness[item.slug] ?? '').trim()).length
  const completionPct = items.length === 0 ? 0 : Math.round((filled / items.length) * 100)

  return transaction(async (tx) => {
    const applicationId = await incubation.createApplication(
      {
        applicantId,
        startupId,
        ideaName: ideaName.trim(),
        problemStatement,
        stageId,
        teamMemberIds,
        status: asDraft ? 'draft' : 'pending',
        completionPct,
        submittedAt: asDraft ? null : new Date(),
      },
      tx
    )

    for (const item of items) {
      const value = String(readiness[item.slug] ?? '').trim()
      if (value) await incubation.setReadinessValue(applicationId, item.id, value, tx)
    }

    if (!asDraft) {
      await platform.logActivity(
        {
          actorUserId: applicantId,
          action: `Submitted incubation application: ${ideaName.trim()}`,
          module: 'Incubation',
          entityType: 'incubation_application',
          entityId: applicationId,
          status: 'pending',
        },
        tx
      )
    }

    return applicationId
  })
}

/**
 * Update the readiness evidence on an existing application.
 *
 * The percentage is recomputed from what is actually stored afterwards, never
 * taken from the client — the same rule `submit` follows, so the ring on the
 * Forge Manager's queue always reflects the evidence and not a claim about it.
 */
export async function saveReadiness({ applicationId, readiness = {} }) {
  const application = await incubation.findApplicationById(applicationId)
  if (!application) throw new NotFoundError('Incubation application')

  const items = await getReadinessItems()

  return transaction(async (tx) => {
    for (const item of items) {
      const value = String(readiness[item.slug] ?? '').trim()
      if (value) await incubation.setReadinessValue(applicationId, item.id, value, tx)
    }

    const stored = await incubation.findReadiness(applicationId)
    await incubation.updateCompletion(applicationId, stored.percent, tx)
    return stored
  })
}

/**
 * Approve an application and unlock Founder access in one transaction.
 *
 * Three things must happen together: the application is marked approved, a
 * grant is recorded with its actor, and the founder role is added to the user.
 * If any step fails the applicant must not be left half-promoted.
 */
export async function grantFounderAccess({ applicationId, actorId, reason = null }) {
  const application = await incubation.findApplicationById(applicationId)
  if (!application) throw new NotFoundError('Incubation application')

  const founderRole = await getRoleBySlug('founder')
  if (!founderRole) throw new ValidationError('Founder role is missing from reference data.')

  return transaction(async (tx) => {
    await incubation.review(applicationId, 'approved', actorId, tx)

    await incubation.createGrant(
      {
        userId: application.applicant.id,
        startupId: application.startup?.id ?? null,
        applicationId,
        grantedBy: actorId,
        reason,
      },
      tx
    )

    await users.grantRole(
      application.applicant.id,
      founderRole.id,
      { isPrimary: false, grantedBy: actorId },
      tx
    )

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Granted Founder access: ${application.applicant.name}`,
        module: 'Access',
        entityType: 'incubation_application',
        entityId: applicationId,
        status: 'success',
      },
      tx
    )

    await platform.createNotification(
      {
        userId: application.applicant.id,
        type: 'access',
        title: 'Founder access granted',
        body: `You can now manage ${application.startup?.name ?? 'your startup'} on ATLAS Forge.`,
        linkUrl: '/founder/home',
      },
      tx
    )

    return true
  })
}

/**
 * Grant Founder access starting from a *user* rather than an application.
 *
 * The Forge Manager grants from the incubation queue, so an application is
 * always in hand. The Backend Manager grants from Role Management, which
 * searches by App ID — the account may have an application waiting, or none at
 * all. Where one exists it is approved in the same transaction, so the two
 * routes never leave an approved grant sitting beside an unreviewed
 * application.
 */
export async function grantAccessToUser({ userId, actorId, reason = null }) {
  const user = await users.findById(userId)
  if (!user) throw new NotFoundError('User')

  const founderRole = await getRoleBySlug('founder')
  if (!founderRole) throw new ValidationError('Founder role is missing from reference data.')

  const existing = await incubation.findGrants({ userId })
  if (existing.some((grant) => grant.isActive)) {
    throw new ConflictError('This account already has Founder access.')
  }

  const applications = await incubation.findApplications({ applicantId: userId })
  const application = applications.find((row) => row.status !== 'approved') ?? applications[0] ?? null

  return transaction(async (tx) => {
    if (application && application.status !== 'approved') {
      await incubation.review(application.id, 'approved', actorId, tx)
    }

    await incubation.createGrant(
      {
        userId,
        startupId: application?.startup?.id ?? null,
        applicationId: application?.id ?? null,
        grantedBy: actorId,
        reason,
      },
      tx
    )

    await users.grantRole(userId, founderRole.id, { isPrimary: false, grantedBy: actorId }, tx)

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Granted Founder access: ${user.name}`,
        module: 'Access',
        entityType: 'user',
        entityId: userId,
        status: 'success',
      },
      tx
    )

    await platform.createNotification(
      {
        userId,
        type: 'access',
        title: 'Founder access granted',
        body: `You can now manage ${application?.startup?.name ?? 'your startup'} on ATLAS Forge.`,
        linkUrl: '/founder/home',
      },
      tx
    )

    return true
  })
}

/** Revoke Founder access — removes the role and closes the grant together. */
export async function revokeFounderAccess({ grantId, userId, actorId, reason = null }) {
  const founderRole = await getRoleBySlug('founder')
  if (!founderRole) throw new ValidationError('Founder role is missing from reference data.')

  const user = await users.findById(userId)
  if (!user) throw new NotFoundError('User')

  return transaction(async (tx) => {
    if (grantId) await incubation.revokeGrant(grantId, actorId, reason, tx)
    await users.revokeRole(userId, founderRole.id, tx)

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Revoked Founder access: ${user.name}`,
        module: 'Access',
        entityType: 'user',
        entityId: userId,
        status: 'action',
      },
      tx
    )

    await platform.createNotification(
      {
        userId,
        type: 'access',
        title: 'Founder access revoked',
        body: 'Your account has reverted to Standard Student.',
        linkUrl: '/student/home',
      },
      tx
    )

    return true
  })
}
