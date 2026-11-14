-- ===========================================================================
-- 014 · users.google_sub / google_linked_at — link an account to Google Sign-In
--
--   npm run db:migrate migrations/014_users_google_link.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Adds TWO nullable columns and ONE unique index to `forge_users`:
--
--   google_sub        Google's stable account id (`sub` claim of the verified ID
--                     token). Set the first time an existing account signs in
--                     with Google; later Google logins resolve by it first, so a
--                     linked account keeps working even if its email changes.
--   google_linked_at  When the link was made. NULL = never signed in with Google,
--                     which also lets reports count Google vs password users.
--
-- The application tolerates this migration NOT being applied yet: a missing
-- column is treated as "no link" (see users.repository findByGoogleSub /
-- linkGoogleAccount), so deploy order does not matter.
--
-- Non-destructive: both columns default to NULL, no existing data is modified,
-- nothing is dropped or renamed. Idempotent across MySQL 8 and MariaDB (each
-- step is guarded by information_schema and run through a prepared statement,
-- the same pattern as migration 010).
-- ===========================================================================

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'forge_users'
     AND COLUMN_NAME  = 'google_sub'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE forge_users ADD COLUMN google_sub VARCHAR(255) NULL DEFAULT NULL AFTER email',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'forge_users'
     AND COLUMN_NAME  = 'google_linked_at'
);
SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE forge_users ADD COLUMN google_linked_at TIMESTAMP NULL DEFAULT NULL AFTER google_sub',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- One Google identity links to at most one account. NULLs do not collide.
SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'forge_users'
     AND INDEX_NAME   = 'uq_users_google_sub'
);
SET @ddl := IF(@idx_exists = 0,
  'ALTER TABLE forge_users ADD UNIQUE KEY uq_users_google_sub (google_sub)',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- Verify
--
--   SHOW COLUMNS FROM forge_users LIKE 'google_%';
--   SHOW INDEX FROM forge_users WHERE Key_name = 'uq_users_google_sub';
--   SELECT COUNT(*) AS google_linked FROM forge_users WHERE google_sub IS NOT NULL;
-- ===========================================================================
