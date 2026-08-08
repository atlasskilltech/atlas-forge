import 'server-only'

import { transaction } from '@/lib/db'
import { ConflictError, NotFoundError, ValidationError } from '@/lib/errors'
import * as startups from '@/lib/repositories/startups.repository'
import * as platform from '@/lib/repositories/platform.repository'
import { getIndustries, getStages, resolveId } from './lookups.service'

export const list = (filters) => startups.findAll(filters)
export const getBySlug = (slug) => startups.findBySlug(slug)
export const getForOwner = (userId) => startups.findByOwner(userId)
export const countByStatus = () => startups.countByStatus()

export function listActive() {
  return startups.findAll({ status: 'active' })
}

export function listFeatured() {
  return startups.findAll({ featured: true })
}

/** Startup plus its team — the My Startup Page and public profile view. */
export async function getWithTeam(slugOrId) {
  const startup =
    typeof slugOrId === 'string'
      ? await startups.findBySlug(slugOrId)
      : await startups.findBySlug(String(slugOrId))
  if (!startup) throw new NotFoundError('Startup')
  const members = await startups.findMembers(startup.id)
  return { ...startup, members }
}

export async function getOwnedWithTeam(userId) {
  const startup = await startups.findByOwner(userId)
  if (!startup) return null
  const members = await startups.findMembers(startup.id)
  return { ...startup, members }
}

/**
 * Create a startup for a founder who does not have one yet.
 *
 * It starts `pending`, not `active`: filling in a profile is a submission, and
 * the Forge Manager still decides whether it joins the programme. The owner is
 * added as a team member in the same transaction so a startup is never left
 * with an empty team.
 */
export async function createForOwner(input, ownerUserId) {
  if (!input?.name?.trim()) throw new ValidationError('A startup name is required.')

  const existing = await startups.findByOwner(ownerUserId)
  if (existing) throw new ConflictError('You already have a startup on ATLAS Forge.')

  const name = input.name.trim()
  const [industryId, stageId] = await Promise.all([
    resolveId(getIndustries, input.industrySlug),
    resolveId(getStages, input.stageSlug),
  ])

  return transaction(async (tx) => {
    const slug = await startups.nextSlug(name, tx)
    const startupId = await startups.create(
      {
        slug,
        name,
        tagline: input.tagline ?? null,
        problemStatement: input.problemStatement ?? null,
        industryId,
        stageId,
        ownerUserId,
        isHiring: input.isHiring ?? false,
        openRoles: input.openRoles ?? 0,
      },
      tx
    )

    await startups.addMember(startupId, ownerUserId, 'Founder', tx)

    await platform.logActivity(
      {
        actorUserId: ownerUserId,
        action: `Created startup profile: ${name}`,
        module: 'Projects',
        entityType: 'startup',
        entityId: startupId,
        status: 'pending',
      },
      tx
    )

    return { id: startupId, slug }
  })
}

export async function updateListing(startupId, input, actorId) {
  if (!input?.name?.trim()) throw new ValidationError('A startup name is required.')

  const [industryId, stageId] = await Promise.all([
    resolveId(getIndustries, input.industrySlug),
    resolveId(getStages, input.stageSlug),
  ])

  return transaction(async (tx) => {
    const updated = await startups.update(
      startupId,
      {
        name: input.name.trim(),
        tagline: input.tagline,
        problemStatement: input.problemStatement,
        industryId,
        stageId,
        isHiring: input.isHiring,
        openRoles: input.openRoles,
      },
      tx
    )
    if (!updated) throw new NotFoundError('Startup')

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Updated startup listing: ${input.name.trim()}`,
        module: 'Projects',
        entityType: 'startup',
        entityId: startupId,
        status: 'success',
      },
      tx
    )
    return true
  })
}

export async function setFeatured(startupId, featured, actorId) {
  return transaction(async (tx) => {
    const updated = await startups.setFeatured(startupId, featured, tx)
    if (!updated) throw new NotFoundError('Startup')

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `${featured ? 'Featured' : 'Unfeatured'} startup`,
        module: 'Projects',
        entityType: 'startup',
        entityId: startupId,
        status: 'success',
      },
      tx
    )
    return true
  })
}
