import 'server-only'

const STARTUP_FIELDS = `
  s.id, s.slug, s.name, s.tagline, s.problem_statement, s.is_hiring, s.open_roles,
  s.is_featured, s.status, s.initial, s.avatar_tone, s.logo_url, s.created_at,
  i.name AS industry_name, i.slug AS industry_slug,
  st.name AS stage_name, st.slug AS stage_slug,
  o.full_name AS owner_name, o.id AS owner_user_id, o.initials AS owner_initials,
  m.full_name AS mentor_name, m.id AS mentor_id
`

const STARTUP_JOINS = `
    FROM startups s
    LEFT JOIN industries i ON i.id = s.industry_id
    LEFT JOIN stages st    ON st.id = s.stage_id
    LEFT JOIN users o      ON o.id = s.owner_user_id
    LEFT JOIN mentors m    ON m.id = s.mentor_id
`

export const SELECT_STARTUPS = `
  SELECT ${STARTUP_FIELDS},
         (SELECT COUNT(*) FROM startup_members sm
           WHERE sm.startup_id = s.id AND sm.deleted_at IS NULL) AS team_size
  ${STARTUP_JOINS}
   WHERE s.deleted_at IS NULL
     AND (? IS NULL OR i.slug = ?)
     AND (? IS NULL OR s.is_hiring = ?)
     AND (? IS NULL OR s.is_featured = ?)
     AND (? IS NULL OR s.status = ?)
   ORDER BY s.is_featured DESC, s.name
`

export const SELECT_STARTUP_BY_SLUG = `
  SELECT ${STARTUP_FIELDS},
         (SELECT COUNT(*) FROM startup_members sm
           WHERE sm.startup_id = s.id AND sm.deleted_at IS NULL) AS team_size
  ${STARTUP_JOINS}
   WHERE s.slug = ? AND s.deleted_at IS NULL
`

export const SELECT_STARTUP_BY_OWNER = `
  SELECT ${STARTUP_FIELDS},
         (SELECT COUNT(*) FROM startup_members sm
           WHERE sm.startup_id = s.id AND sm.deleted_at IS NULL) AS team_size
  ${STARTUP_JOINS}
   WHERE s.owner_user_id = ? AND s.deleted_at IS NULL
   ORDER BY s.created_at
   LIMIT 1
`

export const SELECT_STARTUP_MEMBERS = `
  SELECT sm.id, sm.role_title, sm.joined_at,
         u.id AS user_id, u.full_name, u.initials, u.avatar_tone, u.app_id
    FROM startup_members sm
    JOIN users u ON u.id = sm.user_id
   WHERE sm.startup_id = ? AND sm.deleted_at IS NULL AND u.deleted_at IS NULL
   ORDER BY sm.joined_at, sm.id
`

/**
 * Created as `pending`: a founder filling in their startup profile does not
 * put a startup live on the platform — the Forge Manager still approves it.
 */
export const INSERT_STARTUP = `
  INSERT INTO startups
    (slug, name, tagline, problem_statement, industry_id, stage_id,
     owner_user_id, is_hiring, open_roles, initial, avatar_tone, logo_url, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
`

export const SELECT_STARTUP_SLUGS_LIKE = `
  SELECT slug FROM startups WHERE slug = ? OR slug LIKE ?
`

export const INSERT_STARTUP_MEMBER = `
  INSERT INTO startup_members (startup_id, user_id, role_title, joined_at)
  VALUES (?, ?, ?, CURDATE())
  ON DUPLICATE KEY UPDATE role_title = VALUES(role_title), deleted_at = NULL
`

export const UPDATE_STARTUP = `
  UPDATE startups
     SET name = ?, tagline = ?, problem_statement = ?, industry_id = ?, stage_id = ?,
         is_hiring = ?, open_roles = ?, logo_url = ?
   WHERE id = ? AND deleted_at IS NULL
`

export const SET_STARTUP_FEATURED = `
  UPDATE startups SET is_featured = ? WHERE id = ? AND deleted_at IS NULL
`

export const COUNT_STARTUPS_BY_STATUS = `
  SELECT status, COUNT(*) AS total
    FROM startups
   WHERE deleted_at IS NULL
   GROUP BY status
`
