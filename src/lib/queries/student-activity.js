/**
 * SQL for the Student Activity API (GET /api/public/student-activity).
 *
 * Read-only. Every statement is a SELECT; nothing here writes, and every value
 * travels as a bound `?` parameter. The feature is isolated in its own query /
 * repository / service trio — it reuses no registration write path and changes
 * none of them.
 *
 * The entry point is the UNIVERSITY Student Application ID stored on
 * `registration_requests.student_application_id` (NOT the `AFN-` reference and
 * NOT the `AFM-`/`ATL-` Forge App ID). From the matching Atlas Student
 * registration we follow real foreign keys outward: `approved_user_id` → the
 * account, then the account's roles, incubation applications, startups, founder
 * grants and audit-log entries.
 */

/**
 * Every Atlas Student registration carrying this exact Application ID. Returns
 * an array because the column is not unique; the service refuses to combine
 * unrelated students when more than one row comes back.
 */
export const SELECT_REGISTRATIONS_BY_APPLICATION_ID = `
  SELECT
    r.id, r.reference, r.student_application_id, r.role_category,
    r.status, r.rejection_reason, r.created_at, r.reviewed_at,
    r.approved_user_id
  FROM registration_requests r
  WHERE r.role_category = 'atlas_student'
    AND r.student_application_id = ?
  ORDER BY r.created_at DESC, r.id DESC
`

/** The account an approval created or attached to (NULL approved_user_id → skip). */
export const SELECT_ACCOUNT_BY_ID = `
  SELECT id, app_id, full_name, status, created_at, last_active_at, deleted_at
  FROM users
  WHERE id = ?
`

/** Current + historical role grants for the account (revoked ones included). */
export const SELECT_ROLES_BY_USER = `
  SELECT ur.role_id, ro.slug, ro.name, ur.is_primary, ur.granted_at, ur.revoked_at
  FROM user_roles ur
  JOIN roles ro ON ro.id = ur.role_id
  WHERE ur.user_id = ?
  ORDER BY ur.granted_at ASC, ur.role_id ASC
`

/** Incubation applications owned by the account. */
export const SELECT_INCUBATION_BY_USER = `
  SELECT id, idea_name, status, completion_pct, submitted_at, reviewed_at, created_at
  FROM incubation_applications
  WHERE applicant_user_id = ?
    AND deleted_at IS NULL
  ORDER BY created_at ASC, id ASC
`

/** Startups owned by the account. */
export const SELECT_STARTUPS_OWNED_BY_USER = `
  SELECT id, name, status, created_at
  FROM startups
  WHERE owner_user_id = ?
    AND deleted_at IS NULL
  ORDER BY created_at ASC, id ASC
`

/** Startups the account is a (non-owner) member of. */
export const SELECT_STARTUP_MEMBERSHIPS_BY_USER = `
  SELECT sm.startup_id, s.name, s.status, sm.role_title, sm.joined_at, sm.created_at
  FROM startup_members sm
  JOIN startups s ON s.id = sm.startup_id AND s.deleted_at IS NULL
  WHERE sm.user_id = ?
    AND sm.deleted_at IS NULL
  ORDER BY sm.created_at ASC, sm.id ASC
`

/** Founder access grants for the account (granted and revoked). */
export const SELECT_FOUNDER_GRANTS_BY_USER = `
  SELECT id, startup_id, incubation_application_id, reason, granted_at, revoked_at
  FROM founder_access_grants
  WHERE user_id = ?
  ORDER BY granted_at ASC, id ASC
`

/**
 * Audit-log entries about this student: anything whose actor is the account, or
 * whose entity is the account, or whose entity is this registration row. The
 * registration-entity rows are deduplicated against the derived registration
 * decision in the service, so the same approval is not reported twice.
 *
 * `meta` and the actor identity are deliberately NOT selected — they can carry
 * unrelated context and staff identity, neither of which this endpoint exposes.
 */
export const SELECT_ACTIVITY_LOGS_FOR_STUDENT = `
  SELECT id, action, module, entity_type, entity_id, status, created_at
  FROM activity_logs
  WHERE (entity_type = 'registration_request' AND entity_id = ?)
     OR (actor_user_id = ?)
     OR (entity_type = 'user' AND entity_id = ?)
  ORDER BY created_at ASC, id ASC
`
