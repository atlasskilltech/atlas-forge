/**
 * The five platform roles and their visual identity.
 *
 * Reference: /reference/mast ui/Login/Role Select.png (monogram tints)
 *            /reference/phone components/TopBar/*.png (role chip tints)
 *
 * `tone` drives the role-select monogram and arrow. `chipTone` drives the
 * mobile top-bar chip — the two differ only for Founder, matching the Figma.
 * `label` / `mobileLabel` likewise differ only for Founder, which the mobile
 * role-select screen shortens to just "Founder".
 */
export const ROLES = {
  STUDENT: 'student',
  FOUNDER: 'founder',
  FORGE_MANAGER: 'forge-manager',
  BACKEND_MANAGER: 'backend-manager',
  SUPER_ADMIN: 'super-admin',
}

export const ROLE_LIST = [
  {
    id: ROLES.STUDENT,
    initials: 'ST',
    label: 'Standard Student',
    shortLabel: 'Student',
    mobileLabel: 'Standard Student',
    description: 'Browse jobs, projects, mentorship & flag availability',
    mobileDescription: 'Browse jobs & projects',
    tone: 'primary',
    chipTone: 'primary',
    viewOnly: false,
  },
  {
    id: ROLES.FOUNDER,
    initials: 'FD',
    label: 'Founder (Startup)',
    shortLabel: 'Founder',
    mobileLabel: 'Founder',
    description: 'Manage your startup, post jobs and contact students',
    mobileDescription: 'Manage startup & post jobs',
    tone: 'success',
    chipTone: 'primary',
    viewOnly: false,
  },
  {
    id: ROLES.FORGE_MANAGER,
    initials: 'FM',
    label: 'Forge Manager',
    shortLabel: 'Forge Manager',
    mobileLabel: 'Forge Manager',
    description: 'Oversee the incubator, approve content and assign mentors',
    mobileDescription: 'Oversee the incubator',
    tone: 'warning',
    chipTone: 'warning',
    viewOnly: false,
  },
  {
    id: ROLES.BACKEND_MANAGER,
    initials: 'BM',
    label: 'Backend Manager',
    shortLabel: 'Backend Mgr',
    mobileLabel: 'Backend Manager',
    description: 'Platform settings, user roles and full override access',
    mobileDescription: 'Platform settings & roles',
    tone: 'danger',
    chipTone: 'danger',
    viewOnly: false,
  },
  {
    id: ROLES.SUPER_ADMIN,
    initials: 'SA',
    label: 'Super Admin',
    shortLabel: 'Super Admin',
    mobileLabel: 'Super Admin',
    description: 'Read-only visibility across the entire platform',
    mobileDescription: 'Read-only platform view',
    tone: 'neutral',
    chipTone: 'neutral',
    viewOnly: true,
  },
]

/** Lookup helper — `getRole('founder')`. */
export function getRole(id) {
  return ROLE_LIST.find((role) => role.id === id) || null
}
