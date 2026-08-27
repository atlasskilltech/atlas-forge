import 'server-only'

/**
 * Reference-list SQL. Every lookup table shares the same shape, so one
 * parameterised builder covers them instead of eight near-identical strings.
 *
 * The table name is NOT user input — it comes from ALLOWED below and is
 * validated before interpolation, because a table name cannot be a bound
 * parameter in SQL.
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
      FROM ${table}
     WHERE is_active = TRUE
     ORDER BY sort_order, name
  `
}

export const SELECT_SKILLS = `
  SELECT id, slug, name, category
    FROM skills
   WHERE is_active = TRUE
   ORDER BY category, name
`

export const SELECT_SKILLS_BY_CATEGORY = `
  SELECT id, slug, name, category
    FROM skills
   WHERE is_active = TRUE AND category = ?
   ORDER BY name
`

export const SELECT_PERMISSIONS_FOR_ROLE = `
  SELECT p.id, p.slug, p.name, p.module
    FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN roles r             ON r.id = rp.role_id
   WHERE r.slug = ?
   ORDER BY p.module, p.slug
`

export const SELECT_ALL_SETTINGS = `
  SELECT id, setting_key, setting_value, value_type, group_key, label, description, updated_at
    FROM platform_settings
   ORDER BY FIELD(group_key, 'general', 'access', 'moderation'), id
`

export const SELECT_SETTING = `
  SELECT id, setting_key, setting_value, value_type, group_key, label, description
    FROM platform_settings
   WHERE setting_key = ?
`

export const UPDATE_SETTING = `
  UPDATE platform_settings
     SET setting_value = ?, updated_by = ?
   WHERE setting_key = ?
`
