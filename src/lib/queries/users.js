import 'server-only'

/**
 * User, role-assignment and student-profile SQL.
 *
 * Every SELECT filters `deleted_at IS NULL` — soft-deleted rows must never
 * surface through a normal read path.
 */

const USER_FIELDS = `
  u.id, u.app_id, u.full_name, u.email, u.initials, u.avatar_tone, u.bio,
  u.status, u.last_active_at, u.created_at
`

export const SELECT_USER_BY_ID = `
  SELECT ${USER_FIELDS} FROM users u
   WHERE u.id = ? AND u.deleted_at IS NULL
`

export const SELECT_USER_BY_APP_ID = `
  SELECT ${USER_FIELDS} FROM users u
   WHERE u.app_id = ? AND u.deleted_at IS NULL
`

/** Includes the hash — only the auth service may call this. */
export const SELECT_USER_CREDENTIALS = `
  SELECT u.id, u.app_id, u.email, u.full_name, u.password_hash, u.status
    FROM users u
   WHERE (u.app_id = ? OR u.email = ?) AND u.deleted_at IS NULL
`

export const SELECT_USER_ROLES = `
  SELECT r.id, r.slug, r.name, r.description, r.is_view_only, r.sort_order,
         ur.is_primary, ur.granted_at
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
   WHERE ur.user_id = ? AND ur.revoked_at IS NULL AND r.is_active = TRUE
   ORDER BY r.sort_order
`

export const SELECT_USER_PERMISSIONS = `
  SELECT DISTINCT p.slug
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p       ON p.id = rp.permission_id
   WHERE ur.user_id = ? AND ur.revoked_at IS NULL
`

export const SELECT_STUDENT_PROFILE = `
  SELECT sp.user_id, sp.programme, sp.year_of_study, sp.hours_per_week,
         sp.work_types, sp.availability_timing, sp.is_available,
         ${USER_FIELDS}
    FROM student_profiles sp
    JOIN users u ON u.id = sp.user_id
   WHERE sp.user_id = ? AND u.deleted_at IS NULL
`

export const SELECT_USER_SKILLS = `
  SELECT s.id, s.slug, s.name, s.category
    FROM student_skills ss
    JOIN skills s ON s.id = ss.skill_id
   WHERE ss.user_id = ?
   ORDER BY s.name
`

/**
 * The student pool. `track` filters by skill category and `availableOnly`
 * by availability; both are optional and bound as parameters.
 */
export const SELECT_STUDENT_POOL = `
  SELECT ${USER_FIELDS},
         sp.programme, sp.year_of_study, sp.hours_per_week,
         sp.work_types, sp.availability_timing, sp.is_available,
         -- Track record shown on the founder's Concierge detail card. Counted
         -- from contracts, the only record of work actually agreed: an
         -- application or an outreach message is interest, not an engagement.
         (SELECT COUNT(*) FROM contracts pc
           WHERE pc.student_user_id = u.id AND pc.deleted_at IS NULL
             AND pc.status = 'completed')                       AS projects_done,
         (SELECT COUNT(*) FROM contracts ec
           WHERE ec.student_user_id = u.id AND ec.deleted_at IS NULL
             AND ec.status IN ('active', 'completed'))          AS engagements
    FROM users u
    JOIN student_profiles sp ON sp.user_id = u.id
   WHERE u.deleted_at IS NULL
     AND u.status = 'active'
     AND (? IS NULL OR sp.is_available = ?)
     AND (? IS NULL OR EXISTS (
           SELECT 1 FROM student_skills ss
             JOIN skills sk ON sk.id = ss.skill_id
            WHERE ss.user_id = u.id AND sk.category = ?))
   ORDER BY u.full_name
`

/** Skills for many users at once — avoids an N+1 across a pool listing. */
export function selectSkillsForUsers(placeholders) {
  return `
    SELECT ss.user_id, s.id, s.slug, s.name, s.category
      FROM student_skills ss
      JOIN skills s ON s.id = ss.skill_id
     WHERE ss.user_id IN ${placeholders}
     ORDER BY s.name
  `
}

/** Directory listing used by the manager "All Users" screens. */
export const SELECT_ALL_USERS = `
  SELECT ${USER_FIELDS},
         st.name AS startup_name,
         (SELECT GROUP_CONCAT(r.name ORDER BY r.sort_order SEPARATOR ', ')
            FROM user_roles ur JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id = u.id AND ur.revoked_at IS NULL) AS role_names,
         -- Slugs as well as names: names are display copy an administrator can
         -- edit, so anything deciding *what a user is* must read the slug.
         (SELECT GROUP_CONCAT(r.slug ORDER BY r.sort_order SEPARATOR ',')
            FROM user_roles ur JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id = u.id AND ur.revoked_at IS NULL) AS role_slugs,
         (SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id
           WHERE ur.user_id = u.id AND ur.revoked_at IS NULL
           ORDER BY ur.is_primary DESC, r.sort_order LIMIT 1) AS primary_role_slug
    FROM users u
    LEFT JOIN startups st ON st.owner_user_id = u.id AND st.deleted_at IS NULL
   WHERE u.deleted_at IS NULL
   ORDER BY u.full_name
`

export const INSERT_USER = `
  INSERT INTO users (app_id, full_name, email, password_hash, initials, avatar_tone, bio, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`

export const UPDATE_USER_PROFILE = `
  UPDATE users SET full_name = ?, email = ?, bio = ?
   WHERE id = ? AND deleted_at IS NULL
`

export const UPDATE_LAST_ACTIVE = `
  UPDATE users SET last_active_at = NOW() WHERE id = ?
`

export const UPSERT_STUDENT_PROFILE = `
  INSERT INTO student_profiles
    (user_id, programme, year_of_study, hours_per_week, work_types, availability_timing, is_available)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE
    programme = VALUES(programme), year_of_study = VALUES(year_of_study),
    hours_per_week = VALUES(hours_per_week), work_types = VALUES(work_types),
    availability_timing = VALUES(availability_timing), is_available = VALUES(is_available)
`

export const UPDATE_AVAILABILITY = `
  UPDATE student_profiles
     SET is_available = ?, hours_per_week = ?, work_types = ?, availability_timing = ?
   WHERE user_id = ?
`

export const DELETE_USER_SKILLS = `DELETE FROM student_skills WHERE user_id = ?`

export const INSERT_USER_SKILL = `
  INSERT IGNORE INTO student_skills (user_id, skill_id) VALUES (?, ?)
`

export const GRANT_ROLE = `
  INSERT INTO user_roles (user_id, role_id, is_primary, granted_by)
  VALUES (?, ?, ?, ?)
  ON DUPLICATE KEY UPDATE revoked_at = NULL, granted_by = VALUES(granted_by), granted_at = NOW()
`

export const REVOKE_ROLE = `
  UPDATE user_roles SET revoked_at = NOW()
   WHERE user_id = ? AND role_id = ? AND revoked_at IS NULL
`

export const SOFT_DELETE_USER = `
  UPDATE users SET deleted_at = NOW(), status = 'inactive' WHERE id = ? AND deleted_at IS NULL
`
