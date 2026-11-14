import { ROLES } from '@/config/roles'

/**
 * The ONE-USER-ONE-ROLE policy, as pure functions.
 *
 * Every user holds exactly one role at a time. The five roles are:
 *
 *   student          shown as "Job Seeker" (the slug is kept so existing URLs,
 *                    permissions and grants keep working)
 *   founder
 *   forge-manager
 *   backend-manager
 *   super-admin      view only
 *
 * `network-member` is retired: approved registrations become Job Seekers.
 *
 * Kept free of `server-only` and database access so it can be unit-tested
 * directly and imported by both the services and the browser forms.
 */

/** The only email domain staff (and Atlas Students / Faculty) may use. */
export const ATLAS_EMAIL_DOMAIN = 'atlasuniversity.edu.in'

/** Every role a user may hold. Exactly one at a time. */
export const ASSIGNABLE_ROLES = Object.freeze([
  ROLES.STUDENT,
  ROLES.FOUNDER,
  ROLES.FORGE_MANAGER,
  ROLES.BACKEND_MANAGER,
  ROLES.SUPER_ADMIN,
])

/** Roles that require an @atlasuniversity.edu.in email. */
export const STAFF_ROLES = Object.freeze([
  ROLES.FORGE_MANAGER,
  ROLES.BACKEND_MANAGER,
  ROLES.SUPER_ADMIN,
])

/**
 * When an old multi-role user is collapsed to one role, the highest of these
 * wins. Also used if the database ever returns more than one active role (it
 * cannot once migration 015 is applied, but the code must still pick one).
 */
export const ROLE_PRIORITY = Object.freeze([
  ROLES.SUPER_ADMIN,
  ROLES.BACKEND_MANAGER,
  ROLES.FORGE_MANAGER,
  ROLES.FOUNDER,
  ROLES.STUDENT,
])

export const isAssignableRole = (slug) => ASSIGNABLE_ROLES.includes(slug)
export const isStaffRole = (slug) => STAFF_ROLES.includes(slug)

/** Lower-case + trim, so every comparison is case-insensitive. */
export function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

/**
 * True only for `something@atlasuniversity.edu.in` (any letter case). A
 * sub-domain such as `x@mail.atlasuniversity.edu.in` or a look-alike such as
 * `x@atlasuniversity.edu.in.evil.com` is NOT accepted.
 */
export function isAtlasEmail(email) {
  const value = normalizeEmail(email)
  const at = value.lastIndexOf('@')
  if (at <= 0) return false
  return value.slice(at + 1) === ATLAS_EMAIL_DOMAIN
}

export const STAFF_EMAIL_MESSAGE = `Forge Manager, Backend Manager and Super Admin accounts must use an @${ATLAS_EMAIL_DOMAIN} email address.`

/**
 * `null` when `email` may hold `roleSlug`, otherwise the error message to show.
 * Non-staff roles accept any email.
 */
export function staffEmailError(roleSlug, email) {
  if (!isStaffRole(roleSlug)) return null
  return isAtlasEmail(email) ? null : STAFF_EMAIL_MESSAGE
}

/**
 * The single role to keep from a list of role slugs, by `ROLE_PRIORITY`.
 * Unknown / retired slugs (e.g. `network-member`) are ignored; if nothing
 * known remains the user becomes a Job Seeker (`student`).
 */
export function pickSingleRole(slugs = []) {
  for (const slug of ROLE_PRIORITY) {
    if (slugs.includes(slug)) return slug
  }
  return ROLES.STUDENT
}

/**
 * Which held roles may open an area that belongs to `areaRole`.
 *
 * Each user holds one role, so normally only that role's own area opens. The
 * Backend Manager is the exception: it sees everything, so it may also open
 * the Forge Manager area and the (read-only) Super Admin area. Student and
 * Founder areas are personal (they need a student profile / a startup), so a
 * Backend Manager is not let into those.
 */
const AREA_ACCESS = Object.freeze({
  [ROLES.FORGE_MANAGER]: [ROLES.FORGE_MANAGER, ROLES.BACKEND_MANAGER],
  [ROLES.SUPER_ADMIN]: [ROLES.SUPER_ADMIN, ROLES.BACKEND_MANAGER],
})

export function canOpenArea(heldSlugs = [], areaRole) {
  const allowed = AREA_ACCESS[areaRole] ?? [areaRole]
  return heldSlugs.some((slug) => allowed.includes(slug))
}

/* -------------------------------------------------------------------------- */
/* Registration ("Join the ATLAS Forge Network") categories                   */
/* -------------------------------------------------------------------------- */

/**
 * "Who are you?" is a category stored on the registration, NOT a role. Every
 * approved registrant becomes a Job Seeker whatever the category.
 *
 *   atlas_student  Atlas email required; their university Application ID
 *                  becomes their ATLAS Forge App ID.
 *   atlas_faculty  Atlas email required; App ID generated (AFM-<year>-NNNNN).
 *   atlas_alumni   any email; App ID generated.
 *   others         any email; App ID generated.
 */
export const ATLAS_EMAIL_CATEGORIES = Object.freeze(['atlas_student', 'atlas_faculty'])

export function registrationEmailError(category, email) {
  if (!ATLAS_EMAIL_CATEGORIES.includes(category)) return null
  if (isAtlasEmail(email)) return null
  return category === 'atlas_student'
    ? `Atlas Students must register with their @${ATLAS_EMAIL_DOMAIN} email address.`
    : `Atlas Faculty must register with their @${ATLAS_EMAIL_DOMAIN} email address.`
}

/** The real Application ID becomes the App ID only for Atlas Students. */
export const usesApplicationIdAsAppId = (category) => category === 'atlas_student'
