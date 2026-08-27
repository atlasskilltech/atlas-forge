import 'server-only'

import { query, queryOne, execute } from '@/lib/db'
import * as sql from '@/lib/queries/lookups'
import { bool, num } from '@/lib/utils/rows'

/**
 * Reference lists and platform settings.
 *
 * Repositories own row → domain mapping. Nothing above this layer sees
 * snake_case columns or TINYINT booleans.
 */

const toLookup = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  ...(row.hint !== undefined && { hint: row.hint }),
  ...(row.description !== undefined && { description: row.description }),
  ...(row.is_view_only !== undefined && { isViewOnly: bool(row.is_view_only) }),
  ...(row.tier !== undefined && { tier: row.tier }),
  ...(row.accepted_types !== undefined && { acceptedTypes: row.accepted_types }),
})

const toSkill = (row) => ({
  id: num(row.id),
  slug: row.slug,
  name: row.name,
  category: row.category,
})

export async function findLookup(table) {
  const rows = await query(sql.selectLookup(table))
  return rows.map(toLookup)
}

export async function findSkills(category = null) {
  const rows = category
    ? await query(sql.SELECT_SKILLS_BY_CATEGORY, [category])
    : await query(sql.SELECT_SKILLS)
  return rows.map(toSkill)
}

export async function findPermissionsForRole(roleSlug) {
  const rows = await query(sql.SELECT_PERMISSIONS_FOR_ROLE, [roleSlug])
  return rows.map((row) => ({
    id: num(row.id),
    slug: row.slug,
    name: row.name,
    module: row.module,
  }))
}

/** Casts each setting to its declared `value_type`. */
function toSetting(row) {
  const raw = row.setting_value
  let value = raw
  if (row.value_type === 'boolean') value = raw === 'true' || raw === '1'
  else if (row.value_type === 'number') value = raw === null ? null : Number(raw)
  else if (row.value_type === 'json') {
    try {
      value = raw ? JSON.parse(raw) : null
    } catch {
      value = null
    }
  }
  return {
    id: num(row.id),
    key: row.setting_key,
    value,
    rawValue: raw,
    valueType: row.value_type,
    group: row.group_key,
    label: row.label,
    description: row.description,
  }
}

export async function findAllSettings() {
  const rows = await query(sql.SELECT_ALL_SETTINGS)
  return rows.map(toSetting)
}

export async function findSetting(key) {
  const row = await queryOne(sql.SELECT_SETTING, [key])
  return row ? toSetting(row) : null
}

export async function updateSetting(key, value, updatedBy = null, conn) {
  const stored = typeof value === 'boolean' ? String(value) : String(value ?? '')
  const { affectedRows } = await execute(sql.UPDATE_SETTING, [stored, updatedBy, key], conn)
  return affectedRows > 0
}
