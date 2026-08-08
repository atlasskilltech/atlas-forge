import 'server-only'

const APPLICATION_FIELDS = `
  ia.id, ia.idea_name, ia.problem_statement, ia.team_member_ids, ia.status,
  ia.completion_pct, ia.submitted_at, ia.reviewed_at, ia.created_at,
  st.name AS stage_name, st.slug AS stage_slug,
  u.id AS applicant_id, u.full_name AS applicant_name, u.initials AS applicant_initials,
  s.id AS startup_id, s.name AS startup_name, s.slug AS startup_slug,
  rv.full_name AS reviewer_name
`

const APPLICATION_JOINS = `
    FROM incubation_applications ia
    JOIN users u          ON u.id = ia.applicant_user_id
    LEFT JOIN stages st   ON st.id = ia.stage_id
    LEFT JOIN startups s  ON s.id = ia.startup_id
    LEFT JOIN users rv    ON rv.id = ia.reviewed_by
`

export const SELECT_INCUBATION_APPLICATIONS = `
  SELECT ${APPLICATION_FIELDS}
  ${APPLICATION_JOINS}
   WHERE ia.deleted_at IS NULL
     AND (? IS NULL OR ia.applicant_user_id = ?)
     AND (? IS NULL OR ia.status = ?)
   ORDER BY ia.created_at DESC
`

export const SELECT_INCUBATION_APPLICATION = `
  SELECT ${APPLICATION_FIELDS}
  ${APPLICATION_JOINS}
   WHERE ia.id = ? AND ia.deleted_at IS NULL
`

/**
 * The readiness checklist for one application, LEFT JOINed from the item list
 * so unfilled items still return a row — the ring counts filled/total.
 */
export const SELECT_APPLICATION_READINESS = `
  SELECT ri.id, ri.slug, ri.name, ri.hint, ri.sort_order, ar.value
    FROM readiness_items ri
    LEFT JOIN application_readiness ar
           ON ar.readiness_item_id = ri.id AND ar.application_id = ?
   WHERE ri.is_active = TRUE
   ORDER BY ri.sort_order
`

export const INSERT_INCUBATION_APPLICATION = `
  INSERT INTO incubation_applications
    (applicant_user_id, startup_id, idea_name, problem_statement, stage_id,
     team_member_ids, status, completion_pct, submitted_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`

export const UPSERT_READINESS_VALUE = `
  INSERT INTO application_readiness (application_id, readiness_item_id, value)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE value = VALUES(value)
`

export const UPDATE_APPLICATION_REVIEW = `
  UPDATE incubation_applications
     SET status = ?, reviewed_by = ?, reviewed_at = NOW()
   WHERE id = ? AND deleted_at IS NULL
`

export const UPDATE_COMPLETION_PCT = `
  UPDATE incubation_applications SET completion_pct = ? WHERE id = ?
`

export const SELECT_FOUNDER_GRANTS = `
  SELECT g.id, g.granted_at, g.revoked_at, g.reason,
         u.id AS user_id, u.full_name, u.initials, u.avatar_tone, u.app_id,
         s.name AS startup_name, s.slug AS startup_slug,
         gb.full_name AS granted_by_name,
         rb.full_name AS revoked_by_name
    FROM founder_access_grants g
    JOIN users u ON u.id = g.user_id
    LEFT JOIN startups s ON s.id = g.startup_id
    LEFT JOIN users gb   ON gb.id = g.granted_by
    LEFT JOIN users rb   ON rb.id = g.revoked_by
   WHERE (? IS NULL OR g.user_id = ?)
   ORDER BY g.granted_at DESC
`

export const INSERT_FOUNDER_GRANT = `
  INSERT INTO founder_access_grants
    (user_id, startup_id, incubation_application_id, granted_by, reason)
  VALUES (?, ?, ?, ?, ?)
`

export const REVOKE_FOUNDER_GRANT = `
  UPDATE founder_access_grants
     SET revoked_by = ?, revoked_at = NOW(), reason = ?
   WHERE id = ? AND revoked_at IS NULL
`

export const COUNT_PENDING_APPLICATIONS = `
  SELECT COUNT(*) AS total FROM incubation_applications
   WHERE status IN ('pending', 'under_review') AND deleted_at IS NULL
`
