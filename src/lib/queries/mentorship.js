import 'server-only'

/**
 * STAFF ONLY — includes email, phone and linkedin_url.
 *
 * Alumni consented to their details being stored for alumni-network purposes,
 * not to them being shown to every founder on the platform. Nothing on a
 * founder screen may read this statement; the founder-facing directory below
 * does not select those three columns at all, so a mistake further up the
 * stack cannot leak them. Same split as `SELECT_USER_CREDENTIALS` in
 * queries/users.js, and for the same reason.
 */
export const SELECT_MENTORS = `
  SELECT m.id, m.full_name, m.initials, m.avatar_tone, m.is_primary,
         m.email, m.phone, m.linkedin_url,
         m.role_title, m.city, m.course, m.graduation_year, m.industry,
         m.experience_band, m.mentoring_availability, m.import_source,
         mt.name AS mentor_type_name, mt.slug AS mentor_type_slug,
         u.id AS user_id
    FROM mentors m
    JOIN mentor_types mt ON mt.id = m.mentor_type_id
    LEFT JOIN users u    ON u.id = m.user_id
   WHERE m.deleted_at IS NULL AND m.is_active = TRUE
     AND (? IS NULL OR mt.slug = ?)
   ORDER BY m.is_primary DESC, m.full_name
`

/**
 * The alumni directory a founder browses. Contact columns are deliberately
 * absent from this SELECT — not filtered out later, never fetched.
 *
 * `mentoring_availability` excludes only the alumni who answered "Maybe" to
 * mentoring: a founder should not request someone who has not committed. NULL
 * passes, because a mentor entered by hand by staff has no form answer and
 * their presence in the table is the commitment.
 */
export const SELECT_ALUMNI_MENTOR_DIRECTORY = `
  SELECT m.id, m.full_name, m.initials, m.avatar_tone,
         m.role_title, m.city, m.graduation_year, m.experience_band,
         mt.name AS mentor_type_name, mt.slug AS mentor_type_slug
    FROM mentors m
    JOIN mentor_types mt ON mt.id = m.mentor_type_id
   WHERE m.deleted_at IS NULL AND m.is_active = TRUE
     AND mt.slug = 'alumni'
     AND (m.mentoring_availability IS NULL OR m.mentoring_availability = 'yes')
     AND (? IS NULL OR EXISTS (
           SELECT 1
             FROM mentor_mentorship_areas mma
             JOIN mentorship_areas a ON a.id = mma.area_id
            WHERE mma.mentor_id = m.id AND a.slug = ?
         ))
   ORDER BY m.full_name
`

export const SELECT_PRIMARY_MENTOR = `
  SELECT m.id, m.full_name, m.initials, m.avatar_tone,
         mt.name AS mentor_type_name, mt.slug AS mentor_type_slug
    FROM mentors m
    JOIN mentor_types mt ON mt.id = m.mentor_type_id
   WHERE m.is_primary = TRUE AND m.deleted_at IS NULL AND m.is_active = TRUE
   LIMIT 1
`

export function selectAreasForMentors(placeholders) {
  return `
    SELECT mma.mentor_id, a.id, a.slug, a.name
      FROM mentor_mentorship_areas mma
      JOIN mentorship_areas a ON a.id = mma.area_id
     WHERE mma.mentor_id IN ${placeholders} AND a.is_active = TRUE
     ORDER BY a.sort_order
  `
}

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
