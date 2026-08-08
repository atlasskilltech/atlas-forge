import { dayLabel, joinMeta, shortName, timeLabel, yearLabel } from '@/lib/utils/format'
import { classifyAccount } from '@/lib/modules/accounts'

/**
 * Domain objects → the exact props the Backend Manager components already
 * render. Pure functions, as in every other module.
 *
 * Where a screen is shared with the Forge Manager (Contact Log, Contract Log,
 * All Listings) the Forge presenter is reused rather than copied, so the two
 * roles cannot drift into showing the same row differently.
 */

const LISTING_STATUS = {
  draft: { label: 'Draft', tone: 'neutral' },
  pending: { label: 'Pending', tone: 'warning' },
  live: { label: 'Live', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  closed: { label: 'Closed', tone: 'neutral' },
}

const ACTIVITY_STATUS = {
  logged: { label: 'Logged', tone: 'success', dot: 'neutral' },
  pending: { label: 'Pending', tone: 'info', dot: 'primary' },
  success: { label: 'Success', tone: 'success', dot: 'success' },
  action: { label: 'Action', tone: 'warning', dot: 'danger' },
  failed: { label: 'Failed', tone: 'danger', dot: 'danger' },
}

const ERROR_LEVEL = {
  warning: { label: 'Warning', tone: 'warning', dot: 'warning' },
  error: { label: 'Error', tone: 'danger', dot: 'danger' },
  critical: { label: 'Critical', tone: 'danger', dot: 'danger' },
}

const FALLBACK = { label: '—', tone: 'neutral' }

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                  */
/* -------------------------------------------------------------------------- */

export function toDashboardStats(stats) {
  return [
    { value: String(stats.total_users), label: 'Total Users', tone: 'primary' },
    { value: String(stats.active_startups), label: 'Active Startups', tone: 'success' },
    { value: String(stats.pending_listings), label: 'Pending Approvals', tone: 'warning' },
    { value: String(stats.pending_incubations), label: 'Open Incubations', tone: 'success' },
    {
      value: String(stats.platform_errors),
      label: 'Platform Errors',
      // Zero errors is the good state, so it stays neutral rather than red.
      tone: stats.platform_errors > 0 ? 'danger' : 'neutral',
    },
  ]
}

export function toMobileDashboardStats(stats) {
  return [
    { value: String(stats.total_users), label: 'Users', tone: 'danger' },
    { value: String(stats.pending_listings), label: 'Pending', tone: 'warning' },
    { value: String(stats.live_listings), label: 'Jobs', tone: 'success' },
    { value: String(stats.active_startups), label: 'Startups', tone: 'primary' },
  ]
}

export function toActivityRow(entry) {
  const status = ACTIVITY_STATUS[entry.status] ?? ACTIVITY_STATUS.logged
  return {
    id: `activity-${entry.id}`,
    title: entry.action,
    meta: joinMeta(
      entry.actor ? `By ${entry.actor.name}` : 'System',
      dayLabel(entry.createdAt),
      timeLabel(entry.createdAt)
    ),
    dot: status.dot,
  }
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

// Shared with the Forge Manager's directory — see `@/lib/modules/accounts`.
export { classifyAccount }

/**
 * A directory row.
 *
 * Roles are matched on slug, never on the display name — "Founder (Startup)"
 * is copy an administrator can edit, and this decides what the account *is*.
 */
export function toUserRow(user, { now = new Date() } = {}) {
  const { group, role, isManager } = classifyAccount(user)

  return {
    id: String(user.id),
    userId: user.id,
    name: user.name,
    initials: user.initials,
    tone: isManager ? 'dark' : (user.avatarTone ?? 'primary'),
    appId: user.appId,
    role,
    group,
    startup: user.startupName ?? '—',
    status: user.status === 'active' ? 'Active' : 'Inactive',
    statusTone: user.status === 'active' ? 'success' : 'neutral',
    lastActive: user.lastActiveAt ? relativeLabel(user.lastActiveAt, now) : 'Never',
  }
}

/** `1 min ago` · `5 min ago` · `Today` · `Yesterday` · `Jun 24` */
function relativeLabel(value, now) {
  const minutes = Math.floor((now - new Date(value)) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  return dayLabel(value, { now })
}

export function toUserCounts(rows) {
  const count = (group) => rows.filter((row) => row.group === group).length
  return [
    { label: `${count('Students')} Students`, tone: 'info' },
    { label: `${count('Founders')} Founders`, tone: 'success' },
    { label: `${count('Managers')} Managers`, tone: 'warning' },
  ]
}

/* -------------------------------------------------------------------------- */
/* Job queue                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * A queue row, carrying the Forge Manager's verdict in its own column.
 *
 * That column is the point of this screen: the Backend Manager decides *with*
 * the Forge Manager's decision in view, and their own decision is recorded
 * separately rather than replacing it.
 */
export function toQueueRow(listing) {
  const forge = listing.forgeDecision
  const backend = listing.backendDecision
  const status = LISTING_STATUS[listing.status] ?? FALLBACK

  const forgeVerdict = forge
    ? { label: forge === 'approved' ? 'Approved' : 'Rejected', tone: forge === 'approved' ? 'success' : 'danger' }
    : { label: 'Pending', tone: 'warning' }

  return {
    id: String(listing.id),
    listingId: listing.id,
    kind: listing.type === 'collab' ? 'Collab' : 'Job',
    title: listing.title,
    startup: listing.startup?.name ?? '—',
    by: shortName(listing.createdBy?.name),
    date: dayLabel(listing.postedAt ?? listing.createdAt),
    // The FM Decision column, which stays visible after this role acts.
    decision: forgeVerdict.label,
    tone: forgeVerdict.tone,
    // This role's own decision, if it has made one.
    override: backend ?? null,
    status: status.label,
    statusTone: status.tone,
  }
}

export function toQueueCount(rows) {
  return rows.filter((row) => !row.override && row.decision === 'Pending').length
}

/* -------------------------------------------------------------------------- */
/* Role management                                                            */
/* -------------------------------------------------------------------------- */

export function toMatchedUser(user, profile) {
  const slugs = user.roleSlugs ?? []
  const current = slugs.includes('founder') ? 'Founder Unlocked' : 'Standard Student'

  return {
    id: String(user.id),
    userId: user.id,
    name: user.name,
    initials: user.initials,
    tone: user.avatarTone ?? 'primary',
    appId: user.appId,
    meta: joinMeta(
      profile?.programme?.split(' ')[0],
      yearLabel(profile?.yearOfStudy),
      user.appId,
      `Current role: ${current}`
    ),
    startup: user.startupName ?? '—',
    hasAccess: slugs.includes('founder'),
  }
}

export function toGrantRow(grant) {
  return {
    id: String(grant.id),
    grantId: grant.id,
    userId: grant.user.id,
    name: grant.user.name,
    initials: grant.user.initials,
    tone: grant.user.avatarTone ?? 'primary',
    appId: grant.user.appId,
    startup: grant.startup?.name ?? '—',
    granted: joinMeta(
      `Granted by ${grant.grantedByName ?? '—'}`,
      dayLabel(grant.grantedAt)
    ),
    revoked: !grant.isActive,
  }
}

/** The mobile Role Assignments list, which is about accounts rather than grants. */
export function toRoleAssignment(user) {
  const slugs = user.roleSlugs ?? []
  return {
    id: `role-${user.id}`,
    userId: user.id,
    name: user.name,
    initials: user.initials,
    tone: user.avatarTone ?? 'primary',
    role: slugs.includes('founder') ? 'Founder Unlocked' : 'Standard Student',
  }
}

/* -------------------------------------------------------------------------- */
/* Settings                                                                   */
/* -------------------------------------------------------------------------- */

const GROUP_LABEL = {
  general: 'General',
  access: 'Access & Roles',
  moderation: 'Content Moderation',
}

/** Which settings the mobile frame surfaces, in the order it draws them. */
const MOBILE_KEYS = [
  'v1_mode',
  'student_self_registration',
  'job_listings_require_approval',
  'contact_log_auto_cc',
]

const MOBILE_LABEL = {
  v1_mode: 'V1 Mode',
  student_self_registration: 'Self-Registration',
  job_listings_require_approval: 'Job Approval',
  contact_log_auto_cc: 'Contact Log CC',
}

/**
 * A settings row.
 *
 * `control` is derived from the stored value type rather than hard-coded:
 * a boolean is a switch, a string the administrator may change gets an Edit
 * button, and a string they may not is read-only. Adding a setting to
 * `reference-data.sql` therefore gives it the right control automatically.
 */
export function toSettingItem(setting) {
  const control =
    setting.valueType === 'boolean'
      ? 'toggle'
      : EDITABLE_STRINGS.has(setting.key)
        ? 'edit'
        : 'none'

  return {
    id: setting.key,
    title: setting.label,
    detail: setting.valueType === 'boolean' ? (setting.value ? 'Enabled' : 'Disabled') : String(setting.value ?? ''),
    description: setting.description,
    control,
    on: setting.valueType === 'boolean' ? setting.value : undefined,
    value: setting.value,
  }
}

const EDITABLE_STRINGS = new Set(['platform_name'])

export function toSettingsGroups(settings) {
  const groups = new Map()
  for (const setting of settings) {
    if (!groups.has(setting.group)) groups.set(setting.group, [])
    groups.get(setting.group).push(toSettingItem(setting))
  }

  // Ordered as the reference draws them, with any new group appended.
  const order = ['general', 'access', 'moderation']
  const known = order.filter((key) => groups.has(key))
  const extra = [...groups.keys()].filter((key) => !order.includes(key))

  return [...known, ...extra].map((key) => ({
    key,
    label: GROUP_LABEL[key] ?? key,
    items: groups.get(key),
  }))
}

export function toMobileSettings(settings) {
  const byKey = new Map(settings.map((setting) => [setting.key, setting]))
  return MOBILE_KEYS.map((key) => byKey.get(key))
    .filter(Boolean)
    .map((setting) => ({
      ...toSettingItem(setting),
      title: MOBILE_LABEL[setting.key] ?? setting.label,
      detail: setting.key === 'job_listings_require_approval'
        ? (setting.value ? 'Required' : 'Not required')
        : setting.value
          ? 'Enabled'
          : 'Disabled',
    }))
}

/* -------------------------------------------------------------------------- */
/* Logs                                                                       */
/* -------------------------------------------------------------------------- */

export function toLogRow(entry) {
  const status = ACTIVITY_STATUS[entry.status] ?? ACTIVITY_STATUS.logged
  return {
    id: `log-${entry.id}`,
    time: `${dayLabel(entry.createdAt)} ${timeLabel(entry.createdAt)}`,
    actor: entry.actor?.name ?? 'System',
    action: entry.action,
    module: entry.module,
    status: status.label,
    tone: status.tone,
  }
}

/** Error logs render into the same audit-table shape. */
export function toErrorRow(entry) {
  const level = ERROR_LEVEL[entry.level] ?? ERROR_LEVEL.error
  return {
    id: `error-${entry.id}`,
    time: `${dayLabel(entry.createdAt)} ${timeLabel(entry.createdAt)}`,
    actor: entry.userName ?? 'System',
    action: entry.message,
    module: entry.resolvedAt ? 'Resolved' : 'Open',
    status: level.label,
    tone: level.tone,
  }
}

/* -------------------------------------------------------------------------- */
/* Shared profile                                                             */
/* -------------------------------------------------------------------------- */

export function toSharedProfile(user, roles, startupName) {
  const names = roles.map((role) => role.name)
  return {
    name: user.name,
    initials: user.initials,
    email: user.email,
    appId: user.appId,
    bio: user.bio ?? '',
    // "Founder (Startup)" reads better here as the startup it unlocks.
    roles: roles.map((role) =>
      role.slug === 'founder' && startupName ? `Founder — ${startupName}` : role.name
    ),
    access: roles.map((role) => (role.slug === 'founder' ? 'Founder Unlocked' : role.name)),
    mobileRole: names
      .map((name) => name.replace(' (Startup)', ''))
      .join(' · '),
    raw: { name: user.name, email: user.email, bio: user.bio },
  }
}
