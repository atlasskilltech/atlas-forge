import { dayLabel, joinMeta, shortName, timeLabel } from '@/lib/utils/format'
import { classifyAccount } from '@/lib/modules/accounts'

/**
 * Domain objects → the props the Super Admin components render.
 *
 * This role is view-only, so there is nothing here that produces an id for a
 * write, a button state, or a form value — only labels. That is deliberate:
 * the read-only rule is enforced by the permission grants in the database, and
 * the presentation layer gives it nothing to work with either.
 */

const STARTUP_STATUS = {
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  under_review: { label: 'Under Review', tone: 'warning' },
  archived: { label: 'Archived', tone: 'neutral' },
}

const ACTIVITY_DOT = {
  logged: 'neutral',
  pending: 'primary',
  success: 'success',
  action: 'warning',
  failed: 'warning',
}

const FALLBACK = { label: '—', tone: 'neutral' }

/* -------------------------------------------------------------------------- */
/* Overview                                                                   */
/* -------------------------------------------------------------------------- */

export function toOverviewStats(stats) {
  return [
    { value: String(stats.total_users), label: 'Total Users', tone: 'primary' },
    { value: String(stats.active_startups), label: 'Active Startups', tone: 'success' },
    { value: String(stats.live_listings), label: 'Live Job Listings', tone: 'success' },
    { value: String(stats.mentor_sessions), label: 'Mentor Sessions', tone: 'success' },
    { value: String(stats.pending_incubations), label: 'Pending Incubations', tone: 'warning' },
  ]
}

export function toMobileOverviewStats(stats) {
  return [
    { value: String(stats.total_users), label: 'Users', tone: 'primary' },
    { value: String(stats.active_startups), label: 'Startups', tone: 'success' },
    { value: String(stats.live_listings), label: 'Jobs', tone: 'success' },
    { value: String(stats.pending_incubations), label: 'Pending', tone: 'warning' },
  ]
}

export function toOverviewStartup(startup) {
  const status = STARTUP_STATUS[startup.status] ?? FALLBACK
  return {
    id: startup.slug,
    name: startup.name,
    founder: startup.owner?.name ?? '—',
    stage: startup.stage?.name ?? '—',
    status: status.label,
    tone: status.tone,
    openRoles: `${startup.openRoles ?? 0} open`,
    mentor: startup.mentor?.name ?? 'Unassigned',
  }
}

/* -------------------------------------------------------------------------- */
/* Users                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * A directory row without an Actions column — this role has no operations, and
 * the reference draws the table without one.
 */
export function toUserRow(user, { now = new Date() } = {}) {
  const { group, role, isManager } = classifyAccount(user)

  return {
    id: String(user.id),
    name: user.name,
    short: user.name,
    initials: user.initials,
    tone: isManager ? 'dark' : (user.avatarTone ?? 'primary'),
    appId: user.appId,
    role,
    // The mobile card shortens the role to a single word.
    mobileRole: role.split(' ')[0],
    group,
    startup: user.startupName ?? '—',
    status: user.status === 'active' ? 'Active' : 'Inactive',
    statusTone: user.status === 'active' ? 'success' : 'neutral',
    lastActive: user.lastActiveAt ? relativeLabel(user.lastActiveAt, now) : 'Never',
  }
}

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
/* Startups                                                                   */
/* -------------------------------------------------------------------------- */

export function toStartupRow(startup) {
  const status = STARTUP_STATUS[startup.status] ?? FALLBACK
  return {
    id: startup.slug,
    name: startup.name,
    initial: startup.initial ?? startup.name.charAt(0),
    tone: startup.avatarTone ?? 'primary',
    domain: startup.industry?.name ?? '—',
    stage: startup.stage?.name ?? '—',
    founder: shortName(startup.owner?.name),
    team: startup.teamSize ?? 0,
    openRoles: startup.openRoles ?? 0,
    status: status.label,
    statusTone: status.tone,
    mentor: startup.mentor?.name ?? 'Unassigned',
    mobileMeta: joinMeta(startup.industry?.name, startup.stage?.name),
  }
}

export function toStartupStats(startups) {
  const count = (status) => startups.filter((startup) => startup.status === status).length
  const openRoles = startups.reduce((total, startup) => total + (startup.openRoles ?? 0), 0)
  return [
    { value: String(startups.length), label: 'Total Startups', tone: 'primary' },
    { value: String(count('active')), label: 'Active', tone: 'success' },
    {
      value: String(count('pending') + count('under_review')),
      label: 'Pending Review',
      tone: 'warning',
    },
    { value: String(openRoles), label: 'Open Roles', tone: 'primary' },
  ]
}

/* -------------------------------------------------------------------------- */
/* Activity report                                                            */
/* -------------------------------------------------------------------------- */

export function toReportStats({ contacts, liveListings, listingsThisWeek, sessions, upcoming, pendingIncubations }) {
  return [
    {
      value: String(contacts.total),
      label: 'Service Contacts',
      caption: `+${contacts.thisWeek} this week`,
      tone: 'primary',
    },
    {
      value: String(liveListings),
      label: 'Job Listings Live',
      caption: `+${listingsThisWeek} this week`,
      tone: 'success',
    },
    {
      value: String(sessions),
      label: 'Mentorship Sessions',
      caption: `Upcoming: ${upcoming}`,
      tone: 'success',
    },
    {
      value: String(pendingIncubations),
      label: 'New Applications',
      caption: 'Incubation',
      tone: 'warning',
    },
  ]
}

export function toPlatformEvent(entry) {
  return {
    id: `event-${entry.id}`,
    title: entry.action,
    meta: joinMeta(
      entry.actor ? `By ${entry.actor.name}` : 'System',
      dayLabel(entry.createdAt),
      timeLabel(entry.createdAt)
    ),
    dot: ACTIVITY_DOT[entry.status] ?? 'neutral',
  }
}

/** The mobile report drops the actor and keeps only what happened, and when. */
export function toMobileEvent(entry) {
  return {
    id: `mobile-event-${entry.id}`,
    title: entry.action,
    meta: dayLabel(entry.createdAt),
  }
}

/** `Jun 1 – Jul 1, 2026` — the window the report covers. */
export function toReportRange(now = new Date(), days = 30) {
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const format = (date, withYear) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      ...(withYear ? { year: 'numeric' } : {}),
    }).format(date)

  return `${format(from, false)} – ${format(now, true)}`
}
