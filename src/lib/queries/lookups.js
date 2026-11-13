import 'server-only'

import { T } from '@/lib/queries/tables.mjs'

/**
 * Reference-list SQL. Every lookup table shares the same shape, so one
 * parameterised builder covers them instead of eight near-identical strings.
 *
 * The table name is NOT user input — it is a LOGICAL name from ALLOWED below,
 * validated before use and then mapped to its physical (`forge_`) name through
 * the central table map, because a table name cannot be a bound parameter.
 */

const ALLOWED = new Set([
  'roles',
  'industries',
  'stages',
  'listing_types',
  'contract_types',
  'mentor_types',
  'mentorship_areas',
  'readiness_items',
  'document_categories',
])

export function selectLookup(table) {
  if (!ALLOWED.has(table)) {
    throw new Error(`Unknown lookup table: ${table}`)
  }
  const extra = table === 'readiness_items' ? ', hint' : ''
  const roleExtra = table === 'roles' ? ', description, is_view_only' : ''
  // The compliance checklist carries its CORE/RECOMMENDED tier and its own
  // accepted file types, both of which the founder page renders per row.
  const documentExtra =
    table === 'document_categories' ? ', description, tier, accepted_types' : ''
  return `
    SELECT id, slug, name${extra}${roleExtra}${documentExtra}, sort_order
      FROM ${T[table]}
     WHERE is_active = TRUE
     ORDER BY sort_order, name
  `
}

export const SELECT_SKILLS = `
  SELECT id, slug, name, category
    FROM ${T.skills}
   WHERE is_active = TRUE
   ORDER BY category, name
`

export const SELECT_SKILLS_BY_CATEGORY = `
  SELECT id, slug, name, category
    FROM ${T.skills}
   WHERE is_active = TRUE AND category = ?
   ORDER BY name
`

export const SELECT_PERMISSIONS_FOR_ROLE = `
  SELECT p.id, p.slug, p.name, p.module
    FROM ${T.permissions} p
    JOIN ${T.role_permissions} rp ON rp.permission_id = p.id
    JOIN ${T.roles} r             ON r.id = rp.role_id
   WHERE r.slug = ?
   ORDER BY p.module, p.slug
`

export const SELECT_ALL_SETTINGS = `
  SELECT id, setting_key, setting_value, value_type, group_key, label, description, updated_at
    FROM ${T.platform_settings}
   ORDER BY FIELD(group_key, 'general', 'access', 'moderation'), id
`

export const SELECT_SETTING = `
  SELECT id, setting_key, setting_value, value_type, group_key, label, description
    FROM ${T.platform_settings}
   WHERE setting_key = ?
`

export const UPDATE_SETTING = `
  UPDATE ${T.platform_settings}
     SET setting_value = ?, updated_by = ?
   WHERE setting_key = ?
`
