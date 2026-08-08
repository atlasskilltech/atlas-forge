import 'server-only'

import { execute, insert, query, queryOne } from '@/lib/db'
import * as sql from '@/lib/queries/startups'
import { applyFullListCap, withFullListCap } from '@/lib/queries/pagination'
import { bool, iso, num, pair } from '@/lib/utils/rows'

export const toStartup = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  tagline: row.tagline,
  problemStatement: row.problem_statement,
  industry: row.industry_name ? { name: row.industry_name, slug: row.industry_slug } : null,
  stage: row.stage_name ? { name: row.stage_name, slug: row.stage_slug } : null,
  owner: row.owner_user_id
    ? { id: num(row.owner_user_id), name: row.owner_name, initials: row.owner_initials }
    : null,
  mentor: row.mentor_id ? { id: num(row.mentor_id), name: row.mentor_name } : null,
  isHiring: bool(row.is_hiring),
  openRoles: num(row.open_roles),
  isFeatured: bool(row.is_featured),
  status: row.status,
  initial: row.initial,
  avatarTone: row.avatar_tone,
  teamSize: num(row.team_size) ?? 0,
  createdAt: iso(row.created_at),
})

const toMember = (row) => ({
  id: num(row.id),
  userId: num(row.user_id),
  name: row.full_name,
  appId: row.app_id,
  initials: row.initials,
  avatarTone: row.avatar_tone,
  roleTitle: row.role_title,
  joinedAt: iso(row.joined_at),
})

export async function findAll({ industry = null, hiring = null, featured = null, status = null } = {}) {
  const rows = await query(withFullListCap(sql.SELECT_STARTUPS), [
    ...pair(industry),
    ...pair(hiring === null ? null : Boolean(hiring)),
    ...pair(featured === null ? null : Boolean(featured)),
    ...pair(status),
  ])
  return applyFullListCap(rows, 'startups').map(toStartup)
}

export async function findBySlug(slug) {
  const row = await queryOne(sql.SELECT_STARTUP_BY_SLUG, [slug])
  return row ? toStartup(row) : null
}

export async function findByOwner(userId) {
  const row = await queryOne(sql.SELECT_STARTUP_BY_OWNER, [userId])
  return row ? toStartup(row) : null
}

export async function findMembers(startupId) {
  const rows = await query(sql.SELECT_STARTUP_MEMBERS, [startupId])
  return rows.map(toMember)
}

/**
 * Turns a name into a URL slug that is free.
 *
 * The unique key on `slug` is the real guard; this only avoids provoking it on
 * the common case by checking the existing family of slugs in one query and
 * appending the next free suffix.
 */
export async function nextSlug(name, conn) {
  const base =
    name
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'startup'

  const rows = await query(sql.SELECT_STARTUP_SLUGS_LIKE, [base, `${base}-%`], conn)
  if (rows.length === 0) return base

  const taken = new Set(rows.map((row) => row.slug))
  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}

export async function create(data, conn) {
  return insert(
    sql.INSERT_STARTUP,
    [
      data.slug,
      data.name,
      data.tagline ?? null,
      data.problemStatement ?? null,
      data.industryId ?? null,
      data.stageId ?? null,
      data.ownerUserId,
      data.isHiring ?? false,
      data.openRoles ?? 0,
      data.name.charAt(0).toUpperCase(),
      data.avatarTone ?? 'primary',
    ],
    conn
  )
}

/** Adds a member, or restores and retitles one who was removed before. */
export async function addMember(startupId, userId, roleTitle, conn) {
  await execute(sql.INSERT_STARTUP_MEMBER, [startupId, userId, roleTitle], conn)
}

export async function update(startupId, data, conn) {
  const { affectedRows } = await execute(
    sql.UPDATE_STARTUP,
    [
      data.name,
      data.tagline ?? null,
      data.problemStatement ?? null,
      data.industryId ?? null,
      data.stageId ?? null,
      data.isHiring ?? false,
      data.openRoles ?? 0,
      startupId,
    ],
    conn
  )
  return affectedRows > 0
}

export async function setFeatured(startupId, featured, conn) {
  const { affectedRows } = await execute(sql.SET_STARTUP_FEATURED, [Boolean(featured), startupId], conn)
  return affectedRows > 0
}

export async function countByStatus() {
  const rows = await query(sql.COUNT_STARTUPS_BY_STATUS)
  return Object.fromEntries(rows.map((row) => [row.status, num(row.total)]))
}
