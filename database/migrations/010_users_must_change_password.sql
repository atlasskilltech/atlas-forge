-- ===========================================================================
-- 010 · users.must_change_password — force a password reset on first sign-in
--
--   npm run db:migrate migrations/010_users_must_change_password.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Adds ONE column to `users`. When set, the guard layer holds the account on
-- the /change-password screen and refuses every other protected route until a
-- new password is set (see src/lib/auth/guard.js). A freshly approved network
-- member is created with this flag = 1 and a temporary password; everyone else
-- keeps the default 0 and is unaffected.
--
-- Non-destructive: adds a column with DEFAULT 0, so all existing rows read as
-- "no change required". No data is modified, and nothing is dropped or renamed.
--
-- Idempotent across MySQL 8 and MariaDB: `ALTER TABLE ... ADD COLUMN IF NOT
-- EXISTS` is MariaDB-only and is a syntax error on MySQL 8, so the add is
-- guarded by information_schema and run through a prepared statement. Re-running
-- finds the column already present and does nothing.
-- ===========================================================================

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME   = 'users'
     AND COLUMN_NAME  = 'must_change_password'
);

SET @ddl := IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER status',
  'DO 0'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ===========================================================================
-- Verify
--
--   DESCRIBE users;  -- a `must_change_password` tinyint(1) NOT NULL default 0
--   SELECT COUNT(*) FROM users WHERE must_change_password = 1;  -- 0 right after
-- ===========================================================================
