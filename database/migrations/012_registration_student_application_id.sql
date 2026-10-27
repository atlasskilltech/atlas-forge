-- ===========================================================================
-- 012 · registration_requests.student_application_id — the University Student
--       Application ID captured on the public /register form for Atlas Students
--
--   npm run db:migrate migrations/012_registration_student_application_id.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Reference: /reference/form/ (Student frame)
--
-- WHY A COLUMN, NOT details_json:
--   The other student answers (school, type of support, portfolio, message)
--   live in `details_json` because they are free-form review context. The
--   Student Application ID is different: it is an external identity key that a
--   separate project looks a student up by (GET /api/public/registrations
--   ?applicationId=...). A first-class, indexed column lets that lookup be an
--   exact, parameterised match on a real column rather than a scan of a JSON
--   blob, and keeps it out of the free-text details.
--
--   This is the UNIVERSITY'S Student Application ID. It is NOT the ATLAS Forge
--   registration reference (`AFN-…`, column `reference`) and NOT the ATLAS
--   Forge member App ID (`AFM-…`, `users.app_id`). Those are Forge-minted; this
--   is supplied by the applicant and only meaningful for role 'atlas_student'.
--
-- NON-DESTRUCTIVE: adds ONE nullable column and ONE index to one table. No
-- existing row is modified (every current row reads NULL = "not provided"), and
-- nothing is dropped, renamed or re-typed. Alumni/Faculty/Others never set it.
--
-- IDEMPOTENT across MySQL 8 and MariaDB: `ADD COLUMN IF NOT EXISTS` is
-- MariaDB-only and a syntax error on MySQL 8, so both the column and the index
-- are guarded via information_schema and run through a prepared statement.
-- Re-running finds them present and does nothing. (Mirrors migration 010.)
-- ===========================================================================

-- --- Column ----------------------------------------------------------------
SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'registration_requests'
     AND COLUMN_NAME  = 'student_application_id'
);

SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE registration_requests ADD COLUMN student_application_id VARCHAR(64) NULL DEFAULT NULL AFTER role_category',
  'DO 0'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- --- Index (serves the public ?applicationId= lookup) ----------------------
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'registration_requests'
     AND INDEX_NAME   = 'idx_registration_student_app_id'
);

SET @ddl := IF(@idx_exists = 0,
  'ALTER TABLE registration_requests ADD INDEX idx_registration_student_app_id (student_application_id)',
  'DO 0'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- Verify
--
--   DESCRIBE registration_requests;  -- a `student_application_id` varchar(64)
--                                    -- NULL, after role_category
--   SHOW INDEX FROM registration_requests
--     WHERE Key_name = 'idx_registration_student_app_id';
--   SELECT COUNT(*) FROM registration_requests
--    WHERE student_application_id IS NOT NULL;   -- 0 right after migrating
-- ===========================================================================
