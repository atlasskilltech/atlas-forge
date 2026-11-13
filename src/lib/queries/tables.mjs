/**
 * THE authoritative list of ATLAS Forge's database tables, and the only place
 * their physical names are defined.
 *
 * Production shares one MySQL database with Research Portal (`research_`),
 * Atlas News (`news_`) and Employment Survey. Every Forge table carries the
 * `forge_` prefix so it can never be confused with — or collide with — another
 * application's table.
 *
 *   import { T } from '@/lib/queries/tables.mjs'
 *   const SQL = `SELECT ... FROM ${T.users} u JOIN ${T.user_roles} ur ...`
 *
 * Keys are the LOGICAL names (the pre-prefix names, kept so code reads
 * naturally); values are the physical table names. Reading an unknown key
 * throws, so a typo fails when the module loads instead of becoming
 * `FROM undefined` at runtime.
 *
 * Plain ESM with no imports: shared by the Next.js app, the npm scripts and the
 * prefix migration (scripts/migrate-forge-prefix.mjs).
 */

export const TABLE_PREFIX = 'forge_'

/**
 * All 46 Forge tables, in dependency order (a table appears after every table
 * it references). The prefix migration renames exactly these, and nothing else.
 */
export const LOGICAL_TABLES = Object.freeze([
  'roles',
  'permissions',
  'role_permissions',
  'users',
  'user_roles',
  'sessions',
  'skills',
  'student_profiles',
  'student_skills',
  'industries',
  'stages',
  'startups',
  'startup_members',
  'document_categories',
  'startup_documents',
  'listing_types',
  'contract_types',
  'listings',
  'listing_skills',
  'applications',
  'application_events',
  'approvals',
  'concierge_contacts',
  'posted_needs',
  'mentor_types',
  'mentors',
  'mentor_skills',
  'mentorship_areas',
  'mentor_mentorship_areas',
  'mentorship_requests',
  'mentorship_sessions',
  'readiness_items',
  'incubation_applications',
  'application_readiness',
  'founder_access_grants',
  'contracts',
  'platform_settings',
  'activity_logs',
  'error_logs',
  'notifications',
  'messages',
  'login_attempts',
  'service_requests',
  'partner_requests',
  'outsider_incubation_applications',
  'registration_requests',
])

/** Explicit legacy (unprefixed) name -> physical (prefixed) name. */
export const TABLE_RENAMES = Object.freeze(
  Object.fromEntries(LOGICAL_TABLES.map((name) => [name, `${TABLE_PREFIX}${name}`]))
)

/** Logical name -> physical name. Unknown keys throw. */
export const T = new Proxy(TABLE_RENAMES, {
  get(target, key) {
    if (typeof key !== 'string' || key === 'then' || key === 'toJSON') return target[key]
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      throw new Error(`Unknown ATLAS Forge table "${key}" (see src/lib/queries/tables.mjs)`)
    }
    return target[key]
  },
})
