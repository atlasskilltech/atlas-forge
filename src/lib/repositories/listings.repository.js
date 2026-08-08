import 'server-only'

import { execute, insert, query, queryOne } from '@/lib/db'
import * as sql from '@/lib/queries/listings'
import { applyFullListCap, withFullListCap } from '@/lib/queries/pagination'
import { inClause, iso, num, pair } from '@/lib/utils/rows'

export const toListing = (row) => ({
  id: num(row.id),
  type: row.type,
  title: row.title,
  description: row.description,
  compensation: row.compensation,
  collaboratorNeed: row.collaborator_need,
  status: row.status,
  listingType: row.listing_type_name
    ? { name: row.listing_type_name, slug: row.listing_type_slug }
    : null,
  contractType: row.contract_type_name
    ? { name: row.contract_type_name, slug: row.contract_type_slug }
    : null,
  startup: row.startup_id
    ? {
        id: num(row.startup_id),
        name: row.startup_name,
        slug: row.startup_slug,
        initial: row.startup_initial,
        avatarTone: row.startup_tone,
      }
    : null,
  createdBy: {
    id: num(row.created_by_id),
    name: row.created_by_name,
    initials: row.created_by_initials,
  },
  postedAt: iso(row.posted_at),
  createdAt: iso(row.created_at),
  skills: [],
})

const toSkill = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  category: row.category,
})

/** Attaches skills to a set of listings in one extra query, avoiding N+1. */
async function withSkills(listings) {
  if (listings.length === 0) return listings
  const ids = listings.map((l) => l.id)
  const rows = await query(sql.selectSkillsForListings(inClause(ids)), ids)

  const byListing = new Map(listings.map((l) => [l.id, []]))
  for (const row of rows) byListing.get(num(row.listing_id))?.push(toSkill(row))

  return listings.map((listing) => ({ ...listing, skills: byListing.get(listing.id) ?? [] }))
}

export async function findAll({
  status = null,
  type = null,
  startupId = null,
  createdBy = null,
  listingTypeSlug = null,
} = {}) {
  const rows = await query(withFullListCap(sql.SELECT_LISTINGS), [
    ...pair(status),
    ...pair(type),
    ...pair(startupId),
    ...pair(createdBy),
    ...pair(listingTypeSlug),
  ])
  return withSkills(applyFullListCap(rows, 'listings').map(toListing))
}

export async function findById(id) {
  const row = await queryOne(sql.SELECT_LISTING_BY_ID, [id])
  if (!row) return null
  const [listing] = await withSkills([toListing(row)])
  return listing
}

/** Queue rows carry both roles' decisions so the UI can show the override. */
export async function findApprovalQueue({ type = null } = {}) {
  const rows = await query(sql.SELECT_APPROVAL_QUEUE, [...pair(type)])
  const listings = rows.map((row) => ({
    ...toListing(row),
    forgeDecision: row.fm_decision ?? null,
    forgeDecidedAt: iso(row.fm_decided_at),
    backendDecision: row.bm_decision ?? null,
    backendDecidedAt: iso(row.bm_decided_at),
  }))
  return withSkills(listings)
}

export async function create(data, conn) {
  return insert(
    sql.INSERT_LISTING,
    [
      data.type ?? 'job',
      data.title,
      data.description ?? null,
      data.startupId ?? null,
      data.createdBy,
      data.listingTypeId ?? null,
      data.contractTypeId ?? null,
      data.compensation ?? null,
      data.collaboratorNeed ?? null,
      data.status ?? 'pending',
    ],
    conn
  )
}

export async function addSkills(listingId, skillIds, conn) {
  for (const skillId of skillIds) {
    await execute(sql.INSERT_LISTING_SKILL, [listingId, skillId], conn)
  }
}

export async function updateStatus(listingId, status, conn) {
  const { affectedRows } = await execute(sql.UPDATE_LISTING_STATUS, [status, listingId], conn)
  return affectedRows > 0
}

export async function findDecision(listingId, roleSlug) {
  const row = await queryOne(sql.SELECT_DECISION, [listingId, roleSlug])
  return row ? { decision: row.decision, decidedAt: iso(row.decided_at) } : null
}

export async function recordDecision(
  { listingId, roleId, decision, decidedBy, reason = null, isOverride = false },
  conn
) {
  await execute(
    sql.UPSERT_APPROVAL,
    [listingId, roleId, decision, decidedBy, reason, isOverride],
    conn
  )
}

export async function countByStatus() {
  const rows = await query(sql.COUNT_LISTINGS_BY_STATUS)
  return Object.fromEntries(rows.map((row) => [row.status, num(row.total)]))
}
