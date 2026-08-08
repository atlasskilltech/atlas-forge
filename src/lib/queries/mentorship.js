import 'server-only'

export const SELECT_MENTORS = `
  SELECT m.id, m.full_name, m.initials, m.avatar_tone, m.is_primary,
         mt.name AS mentor_type_name, mt.slug AS mentor_type_slug,
         u.id AS user_id
    FROM mentors m
    JOIN mentor_types mt ON mt.id = m.mentor_type_id
    LEFT JOIN users u    ON u.id = m.user_id
   WHERE m.deleted_at IS NULL AND m.is_active = TRUE
     AND (? IS NULL OR mt.slug = ?)
   ORDER BY m.is_primary DESC, m.full_name
`

export const SELECT_PRIMARY_MENTOR = `
  SELECT m.id, m.full_name, m.initials, m.avatar_tone,
         mt.name AS mentor_type_name, mt.slug AS mentor_type_slug
    FROM mentors m
    JOIN mentor_types mt ON mt.id = m.mentor_type_id
   WHERE m.is_primary = TRUE AND m.deleted_at IS NULL AND m.is_active = TRUE
   LIMIT 1
`

export function selectSkillsForMentors(placeholders) {
  return `
    SELECT ms.mentor_id, s.id, s.slug, s.name, s.category
      FROM mentor_skills ms
      JOIN skills s ON s.id = ms.skill_id
     WHERE ms.mentor_id IN ${placeholders}
     ORDER BY s.name
  `
}

export const SELECT_MENTORSHIP_REQUESTS = `
  SELECT r.id, r.topic, r.context, r.preferred_timing, r.status, r.created_at,
         u.id AS requester_id, u.full_name AS requester_name,
         u.initials AS requester_initials, u.avatar_tone AS requester_tone,
         mt.name AS preferred_type_name, mt.slug AS preferred_type_slug,
         s.name AS startup_name
    FROM mentorship_requests r
    JOIN users u ON u.id = r.requester_user_id
    LEFT JOIN mentor_types mt ON mt.id = r.preferred_mentor_type_id
    LEFT JOIN startups s      ON s.id = r.startup_id
   WHERE r.deleted_at IS NULL
     AND (? IS NULL OR r.requester_user_id = ?)
     AND (? IS NULL OR r.status = ?)
   ORDER BY r.created_at DESC
`

export const SELECT_MENTORSHIP_SESSIONS = `
  SELECT ms.id, ms.request_id, ms.topic, ms.scheduled_at, ms.status, ms.notes, ms.created_at,
         m.id AS mentor_id, m.full_name AS mentor_name, m.initials AS mentor_initials,
         mt.name AS mentor_type_name,
         u.id AS mentee_id, u.full_name AS mentee_name, u.initials AS mentee_initials,
         s.name AS startup_name
    FROM mentorship_sessions ms
    LEFT JOIN mentors m       ON m.id = ms.mentor_id
    LEFT JOIN mentor_types mt ON mt.id = m.mentor_type_id
    JOIN users u              ON u.id = ms.mentee_user_id
    LEFT JOIN startups s      ON s.id = ms.startup_id
   WHERE ms.deleted_at IS NULL
     AND (? IS NULL OR ms.mentee_user_id = ?)
     AND (? IS NULL OR ms.status = ?)
   ORDER BY
     FIELD(ms.status, 'upcoming', 'requested', 'completed', 'cancelled'),
     ms.scheduled_at DESC
`

export const INSERT_MENTORSHIP_REQUEST = `
  INSERT INTO mentorship_requests
    (requester_user_id, startup_id, topic, context, preferred_mentor_type_id, preferred_timing)
  VALUES (?, ?, ?, ?, ?, ?)
`

export const INSERT_MENTORSHIP_SESSION = `
  INSERT INTO mentorship_sessions
    (request_id, mentor_id, mentee_user_id, startup_id, topic, scheduled_at, assigned_by, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`

export const UPDATE_REQUEST_STATUS = `
  UPDATE mentorship_requests SET status = ? WHERE id = ? AND deleted_at IS NULL
`

export const COUNT_PENDING_REQUESTS = `
  SELECT COUNT(*) AS total FROM mentorship_requests
   WHERE status = 'requested' AND deleted_at IS NULL
`
