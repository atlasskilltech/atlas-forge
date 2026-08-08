import 'server-only'

import { requireRoleOrRedirect } from '@/lib/auth/guard'
import {
  conciergeService,
  incubationService,
  listingsService,
  mentorshipService,
  platformService,
  startupsService,
  studentsService,
} from '@/lib/services'
import * as forge from '@/lib/modules/forge'
import { getSharedProfile } from '@/lib/modules/shared'
import { isThisWeek } from '@/lib/utils/format'
import * as present from './presenter'

/**
 * Screen assembly for the Super Admin module.
 *
 * This module exports reads and nothing else. That is the whole design: the
 * role holds only `*.view` permissions in the database, and there is no
 * function here that could be called to change anything even by mistake.
 *
 * The read-only rule is enforced in three independent places — the permission
 * grants, the `requireRole` guard on every mutating Route Handler, and the
 * absence of any write in this module. Any one of them failing still leaves
 * two.
 */

const USER_FILTERS = ['All', 'Students', 'Founders', 'Managers']

export const READ_ONLY_NOTE =
  'This is a read-only view. To make changes, contact the Backend Manager or Forge Manager.'

/* -------------------------------------------------------------------------- */
/* Page entry                                                                 */
/* -------------------------------------------------------------------------- */

export async function requireAdminPage(returnTo) {
  const identity = await requireRoleOrRedirect('super-admin', returnTo)
  return {
    identity,
    user: identity.user,
    chromeUser: { name: identity.user.name, initials: identity.user.initials },
  }
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

export async function getOverview() {
  const [stats, startups] = await Promise.all([
    platformService.stats(),
    startupsService.listActive(),
  ])

  return {
    stats: present.toOverviewStats(stats),
    mobileStats: present.toMobileOverviewStats(stats),
    startups: startups.map(present.toOverviewStartup),
  }
}

export async function getUsers() {
  const users = await studentsService.listAll()
  const now = new Date()
  const rows = users.map((user) => present.toUserRow(user, { now }))
  return { users: rows, filters: USER_FILTERS, counts: present.toUserCounts(rows) }
}

/**
 * All Startups.
 *
 * Every startup, not only the active ones — the Status column and the "Pending
 * Review" counter are the point of this screen, and both are empty if the
 * pending ones are filtered out before they arrive.
 */
export async function getStartups() {
  const startups = await startupsService.list({})
  return {
    startups: startups.map(present.toStartupRow),
    stats: present.toStartupStats(startups),
  }
}

export async function getActivityReport() {
  const [stats, contacts, listings, sessions, activity] = await Promise.all([
    platformService.stats(),
    conciergeService.contactStats({}),
    listingsService.listLive(),
    mentorshipService.listSessions({}),
    platformService.listActivity({ limit: 6 }),
  ])

  const now = new Date()

  return {
    stats: present.toReportStats({
      contacts,
      liveListings: stats.live_listings,
      listingsThisWeek: listings.filter((listing) =>
        isThisWeek(listing.postedAt ?? listing.createdAt, { now })
      ).length,
      sessions: sessions.length,
      upcoming: sessions.filter((session) => session.status === 'upcoming').length,
      pendingIncubations: stats.pending_incubations,
    }),
    events: activity.map(present.toPlatformEvent),
    mobileEvents: activity.slice(0, 5).map(present.toMobileEvent),
    range: present.toReportRange(now),
  }
}

/**
 * Incubation Status reuses the All Startups table, whose Stage and Status
 * columns are the subject there.
 */
export const getIncubationStatus = () => getStartups()

export const getProfile = (user) => getSharedProfile(user)

// Shared with the manager roles — same rows, same mapping, no actions.
export const getContacts = () => forge.getContacts()
export const getContracts = () => forge.getContracts()
export const getListings = () => forge.getListings()

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * There are none, and there should never be any. A Super Admin who needs a
 * change made asks the Backend Manager or the Forge Manager — which is exactly
 * what `READ_ONLY_NOTE` tells them on every table.
 *
 * If a future screen appears to need a write here, the right move is to check
 * whether the role should be granted the permission at all, not to add a
 * function that bypasses the question.
 */
