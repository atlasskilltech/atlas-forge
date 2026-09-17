import 'server-only'

/**
 * SQL for the public incubation application — `outsider_incubation_applications`.
 *
 * Statement text only — no driver, no connection. Every value travels as a
 * bound `?` parameter; nothing here interpolates input.
 */

const APPLICATION_FIELDS = `
  o.id, o.reference, o.full_name, o.email, o.phone,
  o.startup_name, o.tagline, o.problem_statement, o.startup_logo_url,
  o.industry_id, i.name AS industry_name, i.slug AS industry_slug,
  o.stage_id, st.name AS stage_name, st.slug AS stage_slug,
  o.pitch_deck, o.product_demo, o.product_assets, o.key_personnel,
  o.status, o.reviewed_by, rv.full_name AS reviewer_name, o.reviewed_at,
  o.rejection_reason,
  o.approved_user_id, au.app_id AS approved_user_app_id,
  o.approved_startup_id, s.slug AS approved_startup_slug,
  o.incubation_application_id,
  mu.id AS matched_user_id, mu.app_id AS matched_user_app_id,
  mu.full_name AS matched_user_name,
  o.created_at, o.updated_at
`

/**
 * `mu` is any existing account that already uses the applicant's email. The
 * reviewer is shown it before approving, because approval attaches the
 * startup to that account rather than creating a second one.
 */
const APPLICATION_JOINS = `
    FROM outsider_incubation_applications o
    LEFT JOIN industries i ON i.id = o.industry_id
    LEFT JOIN stages st    ON st.id = o.stage_id
    LEFT JOIN users rv     ON rv.id = o.reviewed_by
    LEFT JOIN users au     ON au.id = o.approved_user_id
    LEFT JOIN startups s   ON s.id = o.approved_startup_id
    LEFT JOIN users mu     ON mu.email = o.email AND mu.deleted_at IS NULL
`

export const SELECT_OUTSIDER_APPLICATIONS = `
  SELECT ${APPLICATION_FIELDS}
  ${APPLICATION_JOINS}
   WHERE (? IS NULL OR o.status = ?)
   ORDER BY o.created_at DESC, o.id DESC
`

export const SELECT_OUTSIDER_APPLICATION = `
  SELECT ${APPLICATION_FIELDS}
  ${APPLICATION_JOINS}
   WHERE o.id = ?
`

export const INSERT_OUTSIDER_APPLICATION = `
  INSERT INTO outsider_incubation_applications
    (reference, full_name, email, phone, startup_name, tagline, problem_statement,
     industry_id, stage_id, startup_logo_url,
     pitch_deck, product_demo, product_assets, key_personnel,
     status, source_ip, user_agent)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
`

/**
 * Both decisions only ever move a row OUT of 'pending'. The status test in the
 * WHERE clause is what makes a second decision — a double click, two managers
 * at once — change nothing: the loser's UPDATE matches zero rows, and inside a
 * transaction it waits on the winner's row lock before it finds that out.
 */
export const CLAIM_FOR_APPROVAL = `
  UPDATE outsider_incubation_applications
     SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL
   WHERE id = ? AND status = 'pending'
`

export const LINK_APPROVAL = `
  UPDATE outsider_incubation_applications
     SET approved_user_id = ?, approved_startup_id = ?, incubation_application_id = ?
   WHERE id = ?
`

export const REJECT_OUTSIDER_APPLICATION = `
  UPDATE outsider_incubation_applications
     SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ?
   WHERE id = ? AND status = 'pending'
`

export const COUNT_PENDING_BY_EMAIL = `
  SELECT COUNT(*) AS total
    FROM outsider_incubation_applications
   WHERE email = ? AND status = 'pending'
`

/** Per-address throttle: submissions from one client across the window. */
export const COUNT_RECENT_BY_IP = `
  SELECT COUNT(*) AS total
    FROM outsider_incubation_applications
   WHERE source_ip = ?
     AND source_ip <> ''
     AND created_at > (NOW() - INTERVAL ? SECOND)
`

/**
 * Any account holding this email, INCLUDING soft-deleted ones: `uq_users_email`
 * covers deleted rows too, so a deleted account still blocks creating a new
 * one with the same address and approval has to know that up front.
 */
export const SELECT_USER_BY_EMAIL = `
  SELECT id, app_id, full_name, status, deleted_at
    FROM users
   WHERE email = ?
   LIMIT 1
`
