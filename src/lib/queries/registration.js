/**
 * SQL for the public "Join the ATLAS Forge Network" registration.
 *
 * Statement text only — no driver, no connection. Every value travels as a
 * bound `?` parameter; nothing here interpolates input. The role-specific
 * answers are stored as one JSON string in `details_json`; the columns below
 * are the common fields plus the review/audit bookkeeping.
 *
 * Backed by database/migrations/009_registration_requests.sql.
 */

export const INSERT_REGISTRATION_REQUEST = `
  INSERT INTO registration_requests
    (reference, full_name, email, phone, role_category, student_application_id,
     details_json, consent, consented_at, source_ip, user_agent)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`

/**
 * Does this email already have a registration awaiting review?
 *
 * Status-based rather than time-windowed: a person with a pending request
 * should be told "we already have it" however long ago they sent it, and an
 * approved/rejected one does not block a fresh application.
 */
export const COUNT_PENDING_BY_EMAIL = `
  SELECT COUNT(*) AS total
    FROM registration_requests
   WHERE email = ?
     AND status = 'pending'
`

/**
 * Per-address throttle: submissions from one client across the window.
 *
 * The window is compared inside MySQL (NOW() - INTERVAL ? SECOND) so the answer
 * does not depend on the application server's clock agreeing with the database.
 */
export const COUNT_RECENT_BY_IP = `
  SELECT COUNT(*) AS total
    FROM registration_requests
   WHERE source_ip = ?
     AND source_ip <> ''
     AND created_at > (NOW() - INTERVAL ? SECOND)
`

/* -------------------------------------------------------------------------- */
/* Public read-only API (/api/public/registrations)                           */
/* -------------------------------------------------------------------------- */

/**
 * The public, cross-domain, no-auth read API.
 *
 * SELECTS A FIXED, SAFE SUBSET OF COLUMNS ONLY. It deliberately never touches
 * `phone`, `details_json`, `source_ip`, `user_agent`, the review/audit columns
 * or the auto-increment `id` — the public identifier is the random `reference`,
 * chosen (see migration 009) precisely so the count of registrations is not
 * revealed. Add a column here only after weighing that anyone can read it.
 *
 * The optional status filter uses the same `(? IS NULL OR …)` pattern as the
 * review query, so a NULL first parameter means "no filter". Pagination is
 * appended by `withPagination` in the repository, never by string building here.
 */
export const SELECT_PUBLIC_REGISTRATIONS = `
  SELECT r.reference, r.full_name, r.email, r.role_category, r.status, r.created_at
    FROM registration_requests r
   WHERE (? IS NULL OR r.status = ?)
   ORDER BY r.created_at DESC, r.id DESC
`

/** Total rows matching the same optional status filter, for page metadata. */
export const COUNT_PUBLIC_REGISTRATIONS = `
  SELECT COUNT(*) AS total
    FROM registration_requests
   WHERE (? IS NULL OR status = ?)
`

/**
 * The public single-student lookup: GET /api/public/registrations?applicationId=…
 *
 * Exact, parameterised match on the stored University Student Application ID,
 * CONSTRAINED to role 'atlas_student' so an Alumni/Faculty/Others row can never
 * be returned by this path. The LEFT JOIN surfaces the approved ATLAS Forge
 * account (if approval created one) — App ID, active status, first-login flag —
 * none of which is a secret or an internal numeric id.
 *
 * It may match more than one row (the ID is not unique — a student could
 * re-register after a rejection), so the caller counts the rows and refuses to
 * guess rather than leaking the wrong person's record. Newest first, so a
 * future "latest wins" policy has the row it needs without another query.
 */
export const SELECT_STUDENT_BY_APPLICATION_ID = `
  SELECT
    r.reference, r.student_application_id, r.role_category, r.status, r.created_at,
    r.approved_user_id,
    u.app_id               AS account_app_id,
    u.status               AS account_status,
    u.must_change_password AS account_must_change,
    u.deleted_at           AS account_deleted_at
  FROM registration_requests r
  LEFT JOIN users u ON u.id = r.approved_user_id
  WHERE r.role_category = 'atlas_student'
    AND r.student_application_id = ?
  ORDER BY r.created_at DESC, r.id DESC
`

/**
 * Read-only: the most recent non-deleted incubation application for a user, so
 * the lookup can report genuine founder/incubation participation when (and only
 * when) a real row exists. Keyed on `applicant_user_id`, the only link the data
 * model has between an account and an incubation application. No write, no PII.
 */
export const SELECT_LATEST_INCUBATION_STATUS_BY_USER = `
  SELECT status
    FROM incubation_applications
   WHERE applicant_user_id = ?
     AND deleted_at IS NULL
   ORDER BY COALESCE(submitted_at, created_at) DESC, id DESC
   LIMIT 1
`

/* -------------------------------------------------------------------------- */
/* Forge Manager review                                                       */
/* -------------------------------------------------------------------------- */

const REGISTRATION_FIELDS = `
  r.id, r.reference, r.full_name, r.email, r.phone,
  r.role_category, r.student_application_id, r.details_json, r.consent, r.consented_at,
  r.status, r.reviewed_by, rv.full_name AS reviewer_name, r.reviewed_at,
  r.rejection_reason,
  r.approved_user_id, au.app_id AS approved_user_app_id,
  au.must_change_password AS approved_user_must_change,
  r.approved_role_id, ro.name AS approved_role_name,
  mu.id AS matched_user_id, mu.app_id AS matched_user_app_id,
  mu.full_name AS matched_user_name, mu.status AS matched_user_status,
  r.created_at, r.updated_at
`

/**
 * `mu` is any existing, non-deleted account that already uses the applicant's
 * email. The reviewer is shown it before approving, because approval (Phase 6)
 * will attach to that account rather than creating a second one.
 */
const REGISTRATION_JOINS = `
    FROM registration_requests r
    LEFT JOIN users rv ON rv.id = r.reviewed_by
    LEFT JOIN users au ON au.id = r.approved_user_id
    LEFT JOIN roles ro ON ro.id = r.approved_role_id
    LEFT JOIN users mu ON mu.email = r.email AND mu.deleted_at IS NULL
`

export const SELECT_REGISTRATIONS = `
  SELECT ${REGISTRATION_FIELDS}
  ${REGISTRATION_JOINS}
   WHERE (? IS NULL OR r.status = ?)
   ORDER BY r.created_at DESC, r.id DESC
`

export const SELECT_REGISTRATION = `
  SELECT ${REGISTRATION_FIELDS}
  ${REGISTRATION_JOINS}
   WHERE r.id = ?
`

/**
 * Both decisions only ever move a row OUT of 'pending'. The status test in the
 * WHERE clause is what makes a second decision — a double click, two managers
 * at once — change nothing: the loser's UPDATE matches zero rows, and inside a
 * transaction it waits on the winner's row lock before it finds that out.
 *
 * Approval here records only the decision and the reviewer; the account is
 * created in a later phase, which fills `approved_user_id` / `approved_role_id`.
 */
export const CLAIM_FOR_APPROVAL = `
  UPDATE registration_requests
     SET status = 'approved', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = NULL
   WHERE id = ? AND status = 'pending'
`

export const REJECT_REGISTRATION = `
  UPDATE registration_requests
     SET status = 'rejected', reviewed_by = ?, reviewed_at = NOW(), rejection_reason = ?
   WHERE id = ? AND status = 'pending'
`

/**
 * Writes back the account approval created (or attached to). Run in the same
 * transaction as the claim, after the user and role grant exist.
 */
export const LINK_APPROVAL = `
  UPDATE registration_requests
     SET approved_user_id = ?, approved_role_id = ?
   WHERE id = ?
`

/**
 * Any account holding this email, INCLUDING soft-deleted ones: `uq_users_email`
 * covers deleted rows too, so approval has to know about them up front.
 */
export const SELECT_USER_BY_EMAIL = `
  SELECT id, app_id, full_name, status, deleted_at
    FROM users
   WHERE email = ?
   LIMIT 1
`
