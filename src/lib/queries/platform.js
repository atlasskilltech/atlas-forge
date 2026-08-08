import 'server-only'

import { withPageOrCap } from './pagination'

export const SELECT_ACTIVITY_LOGS = `
  SELECT a.id, a.action, a.module, a.entity_type, a.entity_id, a.status, a.meta, a.created_at,
         u.full_name AS actor_name, u.initials AS actor_initials, u.avatar_tone AS actor_tone
    FROM activity_logs a
    LEFT JOIN users u ON u.id = a.actor_user_id
   WHERE (? IS NULL OR a.module = ?)
     AND (? IS NULL OR a.actor_user_id = ?)
   ORDER BY a.created_at DESC
`

/**
 * `LIMIT` cannot be a bound parameter in a prepared statement on MariaDB, so
 * the row count is validated as an integer and interpolated by the shared
 * helper. The filters above stay bound — only the numbers are ever inlined.
 */
export function selectActivityLogs(page) {
  return withPageOrCap(SELECT_ACTIVITY_LOGS, page)
}

/** Same filters as the select, so a page total matches what the page shows. */
export const COUNT_ACTIVITY_LOGS = `
  SELECT COUNT(*) AS total
    FROM activity_logs a
   WHERE (? IS NULL OR a.module = ?)
     AND (? IS NULL OR a.actor_user_id = ?)
`

/**
 * Everything that has happened to one startup, whoever did it.
 *
 * A founder's feed is not "my own actions" — the entries that matter most are
 * other people's: a student applying, the Forge Manager approving a listing.
 * So this matches on the actor *or* on any entity belonging to the startup,
 * which is why the actor's name and avatar are selected alongside the action.
 *
 * A founder with no startup yet passes `null`, and every `entity_id IN (…)`
 * branch then compares against NULL and contributes nothing — the feed falls
 * back to their own actions without needing a second query.
 */
const SELECT_STARTUP_ACTIVITY_BASE = `
  SELECT a.id, a.action, a.module, a.entity_type, a.entity_id, a.status, a.meta, a.created_at,
         u.full_name AS actor_name, u.initials AS actor_initials, u.avatar_tone AS actor_tone
    FROM activity_logs a
    LEFT JOIN users u ON u.id = a.actor_user_id
   WHERE a.actor_user_id = ?
      OR (a.entity_type = 'startup' AND a.entity_id = ?)
      OR (a.entity_type = 'listing' AND a.entity_id IN (
            SELECT l.id FROM listings l
             WHERE l.startup_id = ? AND l.deleted_at IS NULL))
      OR (a.entity_type = 'application' AND a.entity_id IN (
            SELECT ap.id FROM applications ap
              JOIN listings l ON l.id = ap.listing_id
             WHERE l.startup_id = ? AND ap.deleted_at IS NULL))
      OR (a.entity_type = 'concierge_contact' AND a.entity_id IN (
            SELECT cc.id FROM concierge_contacts cc
             WHERE cc.startup_id = ? AND cc.deleted_at IS NULL))
   ORDER BY a.created_at DESC
`

export function selectStartupActivity(page) {
  return withPageOrCap(SELECT_STARTUP_ACTIVITY_BASE, page)
}

export const INSERT_ACTIVITY_LOG = `
  INSERT INTO activity_logs (actor_user_id, action, module, entity_type, entity_id, status, meta)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`

export const SELECT_ERROR_LOGS = `
  SELECT e.id, e.level, e.message, e.context, e.resolved_at, e.created_at,
         u.full_name AS user_name
    FROM error_logs e
    LEFT JOIN users u ON u.id = e.user_id
   ORDER BY e.created_at DESC
`

export function selectErrorLogs(page) {
  return withPageOrCap(SELECT_ERROR_LOGS, page)
}

export const COUNT_ERROR_LOGS = `SELECT COUNT(*) AS total FROM error_logs`

export const INSERT_ERROR_LOG = `
  INSERT INTO error_logs (level, message, stack_trace, context, user_id)
  VALUES (?, ?, ?, ?, ?)
`

export const COUNT_UNRESOLVED_ERRORS = `
  SELECT COUNT(*) AS total FROM error_logs WHERE resolved_at IS NULL
`

export const SELECT_NOTIFICATIONS = `
  SELECT id, type, title, body, link_url, entity_type, entity_id, read_at, created_at
    FROM notifications
   WHERE user_id = ? AND dismissed_at IS NULL
   ORDER BY created_at DESC
`

export function selectNotifications(page) {
  return withPageOrCap(SELECT_NOTIFICATIONS, page)
}

export const COUNT_NOTIFICATIONS = `
  SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND dismissed_at IS NULL
`

export const COUNT_UNREAD_NOTIFICATIONS = `
  SELECT COUNT(*) AS total
    FROM notifications
   WHERE user_id = ? AND read_at IS NULL AND dismissed_at IS NULL
`

export const INSERT_NOTIFICATION = `
  INSERT INTO notifications (user_id, type, title, body, link_url, entity_type, entity_id)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`

export const MARK_NOTIFICATION_READ = `
  UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ? AND read_at IS NULL
`

export const SELECT_MESSAGES = `
  SELECT m.id, m.subject, m.body, m.read_at, m.sent_at,
         s.full_name AS sender_name, s.initials AS sender_initials,
         r.full_name AS recipient_name
    FROM messages m
    JOIN users s ON s.id = m.sender_user_id
    JOIN users r ON r.id = m.recipient_user_id
   WHERE m.deleted_at IS NULL
     AND (? IS NULL OR m.recipient_user_id = ?)
     AND (? IS NULL OR m.sender_user_id = ?)
   ORDER BY m.sent_at DESC
`

export function selectMessages(page) {
  return withPageOrCap(SELECT_MESSAGES, page)
}

/** Same filters as the select. */
export const COUNT_MESSAGES = `
  SELECT COUNT(*) AS total
    FROM messages m
   WHERE m.deleted_at IS NULL
     AND (? IS NULL OR m.recipient_user_id = ?)
     AND (? IS NULL OR m.sender_user_id = ?)
`

export const INSERT_MESSAGE = `
  INSERT INTO messages (sender_user_id, recipient_user_id, subject, body)
  VALUES (?, ?, ?, ?)
`

export const SELECT_CONTRACTS = `
  SELECT c.id, c.title, c.terms, c.status, c.started_at, c.ended_at, c.created_at,
         f.full_name AS founder_name, st.full_name AS student_name,
         s.name AS startup_name, l.title AS listing_title
    FROM contracts c
    JOIN users f  ON f.id = c.founder_user_id
    JOIN users st ON st.id = c.student_user_id
    LEFT JOIN startups s ON s.id = c.startup_id
    LEFT JOIN listings l ON l.id = c.listing_id
   WHERE c.deleted_at IS NULL
     AND (? IS NULL OR c.founder_user_id = ?)
     AND (? IS NULL OR c.student_user_id = ?)
   ORDER BY c.created_at DESC
`

/** Platform-wide counters for the manager dashboards, in one round trip. */
export const SELECT_PLATFORM_STATS = `
  SELECT
    (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)                                   AS total_users,
    (SELECT COUNT(*) FROM users u JOIN student_profiles sp ON sp.user_id = u.id
      WHERE u.deleted_at IS NULL)                                                           AS total_students,
    (SELECT COUNT(DISTINCT ur.user_id) FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE r.slug = 'founder' AND ur.revoked_at IS NULL)                                   AS total_founders,
    (SELECT COUNT(*) FROM startups WHERE status = 'active' AND deleted_at IS NULL)          AS active_startups,
    (SELECT COUNT(*) FROM listings WHERE status = 'pending' AND deleted_at IS NULL)         AS pending_listings,
    (SELECT COUNT(*) FROM listings WHERE status = 'live' AND deleted_at IS NULL)            AS live_listings,
    (SELECT COUNT(*) FROM mentorship_requests WHERE status = 'requested' AND deleted_at IS NULL) AS mentor_requests,
    (SELECT COUNT(*) FROM mentorship_sessions WHERE deleted_at IS NULL)                     AS mentor_sessions,
    (SELECT COUNT(*) FROM incubation_applications
      WHERE status IN ('pending','under_review') AND deleted_at IS NULL)                    AS pending_incubations,
    (SELECT COUNT(*) FROM concierge_contacts WHERE deleted_at IS NULL)                      AS concierge_contacts,
    (SELECT COUNT(*) FROM error_logs WHERE resolved_at IS NULL)                             AS platform_errors
`
