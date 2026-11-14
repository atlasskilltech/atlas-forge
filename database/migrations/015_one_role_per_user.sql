-- ===========================================================================
-- 015 · One user = one role
--
--   ALWAYS take a database dump first, then run the read-only dry run:
--     npm run db:roles:dryrun
--   then apply:
--     npm run db:migrate -- migrations/015_one_role_per_user.sql
--
-- What it does (in this order):
--
--   1. forge_users.app_id is widened from VARCHAR(32) to VARCHAR(64), because
--      an Atlas Student's real university Application ID (up to 64 chars, the
--      size of registration_requests.student_application_id) now becomes their
--      App ID. Only widens; never shortens. The unique index is kept.
--   2. The `student` role is renamed "Job Seeker" (slug unchanged).
--   3. Every user is given exactly ONE active role:
--        - the highest active role by priority
--            super-admin > backend-manager > forge-manager > founder > student
--        - `network-member` counts as `student` (Job Seeker)
--        - a user with NO active role (the seeded mentor accounts) becomes a
--          Job Seeker
--      Every other active role row is revoked (`revoked_at = NOW()`), not
--      deleted, so the history stays.
--   4. Registration rows that point at the network-member role are re-pointed
--      at the Job Seeker role.
--   5. The `network-member` role is removed — only when no active role row
--      uses it any more. Its old (revoked) role rows and its permissions go
--      with it, because `forge_user_roles.role_id` is ON DELETE RESTRICT.
--   6. A database constraint makes "one active role per user" permanent: a
--      column `active_slot` (1 while the row is active, NULL once revoked), a
--      UNIQUE index on (user_id, active_slot), and a CHECK that ties
--      active_slot to revoked_at. A second active role for the same user is
--      then rejected by MySQL/MariaDB itself.
--
-- ATOMIC data change: steps 2–5 run in one transaction (all or nothing).
-- Steps 1 and 6 are DDL (MySQL commits DDL on its own) and are each guarded.
--
-- IDEMPOTENT: every step is either a guarded DDL (information_schema check +
-- prepared statement, as in migrations 010/012) or a DML that changes nothing
-- the second time. Running it twice is safe.
--
-- Tested on MariaDB 10.11. Written for MySQL 8 / MariaDB 10.4+. CHECK
-- constraints are enforced on MySQL 8.0.16+ and MariaDB 10.2+ (older MySQL 8
-- parses and ignores the CHECK; the UNIQUE index still enforces one role).
--
-- ORDER WITH THE CODE: run this migration, then deploy the code, with the app
-- stopped in between. The new code writes `active_slot`; the old code's
-- "revoke role" would be refused by the CHECK once this has run.
-- ===========================================================================

-- --- 1. Widen forge_users.app_id -------------------------------------------
SET @len := (
  SELECT CHARACTER_MAXIMUM_LENGTH FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_users' AND COLUMN_NAME = 'app_id'
);
SET @ddl := IF(@len IS NOT NULL AND @len < 64,
  'ALTER TABLE forge_users MODIFY app_id VARCHAR(64) NOT NULL',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --- 1b. The active_slot column (constraint added in step 6) ---------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles' AND COLUMN_NAME = 'active_slot'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE forge_user_roles ADD COLUMN active_slot TINYINT UNSIGNED NULL DEFAULT 1 AFTER revoked_at',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Steps 2–5 change data, so they run as ONE transaction: if anything fails,
-- the connection closes without COMMIT and every role stays as it was.
START TRANSACTION;

-- --- 2. Rename the student role to Job Seeker ------------------------------
UPDATE forge_roles
   SET name = 'Job Seeker',
       description = 'Browse jobs, projects, mentorship & flag availability'
 WHERE slug = 'student';

SET @student_role := (SELECT id FROM forge_roles WHERE slug = 'student');

-- Stop here (fail loudly) if the Job Seeker role does not exist: every later
-- step depends on it. `SIGNAL` is not allowed outside a stored program, so a
-- deliberate error is raised through a prepared statement instead.
SET @guard := IF(@student_role IS NULL,
  'SELECT * FROM forge_roles_missing_student_role_abort_migration_015',
  'DO 0'
);
PREPARE stmt FROM @guard;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --- 3. Collapse every user to exactly one role ----------------------------
DROP TEMPORARY TABLE IF EXISTS tmp_forge_role_target;
CREATE TEMPORARY TABLE tmp_forge_role_target (
  user_id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  role_id BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB;

INSERT INTO tmp_forge_role_target (user_id, role_id)
SELECT u.id,
       COALESCE(
         (SELECT r.id FROM forge_user_roles ur JOIN forge_roles r ON r.id = ur.role_id
           WHERE ur.user_id = u.id AND ur.revoked_at IS NULL
             AND r.slug IN ('super-admin','backend-manager','forge-manager','founder','student')
           ORDER BY FIELD(r.slug, 'super-admin','backend-manager','forge-manager','founder','student')
           LIMIT 1),
         @student_role
       )
  FROM forge_users u;

-- Revoke every active role that is not the user's target role.
UPDATE forge_user_roles ur
  JOIN tmp_forge_role_target t ON t.user_id = ur.user_id
   SET ur.revoked_at = NOW(), ur.is_primary = 0, ur.active_slot = NULL
 WHERE ur.revoked_at IS NULL AND ur.role_id <> t.role_id;

-- Make the target role active and primary. An already-active row keeps its
-- original granted_at / granted_by; a revoked or missing row is (re)granted now.
INSERT INTO forge_user_roles (user_id, role_id, is_primary, granted_by, active_slot)
SELECT t.user_id, t.role_id, 1, NULL, 1 FROM tmp_forge_role_target t
ON DUPLICATE KEY UPDATE
  granted_at = IF(forge_user_roles.revoked_at IS NULL, forge_user_roles.granted_at, NOW()),
  is_primary = 1,
  revoked_at = NULL,
  active_slot = 1;

-- Revoked rows are never primary and never hold the active slot.
UPDATE forge_user_roles SET is_primary = 0, active_slot = NULL
 WHERE revoked_at IS NOT NULL AND (is_primary = 1 OR active_slot IS NOT NULL);

DROP TEMPORARY TABLE IF EXISTS tmp_forge_role_target;

-- --- 4. Re-point registrations at Job Seeker -------------------------------
-- Only if the registration table exists (migration 009).
SET @has_reg := (
  SELECT COUNT(*) FROM information_schema.TABLES
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_registration_requests'
);
SET @dml := IF(@has_reg > 0,
  'UPDATE forge_registration_requests rr JOIN forge_roles r ON r.id = rr.approved_role_id SET rr.approved_role_id = (SELECT id FROM forge_roles WHERE slug = ''student'') WHERE r.slug = ''network-member''',
  'DO 0'
);
PREPARE stmt FROM @dml;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --- 5. Remove the network-member role (only when nobody uses it) ----------
SET @nm_role := (SELECT id FROM forge_roles WHERE slug = 'network-member');
SET @nm_active := (
  SELECT COUNT(*) FROM forge_user_roles WHERE role_id = @nm_role AND revoked_at IS NULL
);

-- Old revoked rows block the delete (ON DELETE RESTRICT), so they go first —
-- but only when no active row uses the role.
DELETE FROM forge_user_roles
 WHERE @nm_role IS NOT NULL AND @nm_active = 0 AND role_id = @nm_role;
DELETE FROM forge_role_permissions
 WHERE @nm_role IS NOT NULL AND @nm_active = 0 AND role_id = @nm_role;
-- forge_sessions.active_role_id is ON DELETE SET NULL, so live sessions only
-- lose a stale role hint (the role is always re-read from the database).
DELETE FROM forge_roles
 WHERE @nm_role IS NOT NULL AND @nm_active = 0 AND id = @nm_role;

COMMIT;

-- --- 6. Database constraint: one active role row per user ------------------
-- `active_slot` (added in step 1b) is 1 on the active row and NULL on revoked
-- rows. UNIQUE (user_id, active_slot) then allows any number of revoked rows
-- but only ONE active row per user. The CHECK keeps `active_slot` in step with
-- `revoked_at`, so the two can never disagree. (A generated column cannot be
-- used here: MySQL/MariaDB forbid one on `user_id`, which has a CASCADE FK.)
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles' AND INDEX_NAME = 'uq_user_roles_one_active'
);
SET @ddl := IF(@idx_exists = 0,
  'ALTER TABLE forge_user_roles ADD UNIQUE INDEX uq_user_roles_one_active (user_id, active_slot)',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @chk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles'
     AND CONSTRAINT_NAME = 'chk_user_roles_active_slot'
);
SET @ddl := IF(@chk_exists = 0,
  'ALTER TABLE forge_user_roles ADD CONSTRAINT chk_user_roles_active_slot CHECK ((revoked_at IS NULL AND active_slot = 1) OR (revoked_at IS NOT NULL AND active_slot IS NULL))',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- Verify (all must hold):
--
--   -- nobody has more than one active role (expect 0 rows)
--   SELECT user_id, COUNT(*) FROM forge_user_roles WHERE revoked_at IS NULL
--    GROUP BY user_id HAVING COUNT(*) > 1;
--   -- nobody has no role (expect 0)
--   SELECT COUNT(*) FROM forge_users u WHERE NOT EXISTS (SELECT 1 FROM
--     forge_user_roles ur WHERE ur.user_id = u.id AND ur.revoked_at IS NULL);
--   -- network-member is gone (expect 0)
--   SELECT COUNT(*) FROM forge_roles WHERE slug = 'network-member';
--   -- the constraint exists (expect 1 row)
--   SHOW INDEX FROM forge_user_roles WHERE Key_name = 'uq_user_roles_one_active';
-- ===========================================================================
