-- ===========================================================================
-- ROLLBACK for migration 015 — removes ONLY the one-role database constraint
-- and puts the network-member role back, so the PREVIOUS code can run again.
--
--   npm run db:migrate -- rollback/015_down_constraint_only.sql
--
-- Use it only if you roll the CODE back to the release before one-role.
-- It does NOT give users back the extra roles migration 015 removed — for
-- that, restore the database dump taken before the migration.
--
-- What it does: drops the CHECK chk_user_roles_active_slot, the UNIQUE index
-- uq_user_roles_one_active and the column active_slot; re-adds the
-- network-member role row (as migration 011 did). Everything else (roles,
-- users, the Job Seeker name, app_id width) is left as it is.
-- Idempotent: each step is guarded.
-- ===========================================================================

SET @chk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles'
     AND CONSTRAINT_NAME = 'chk_user_roles_active_slot'
);
SET @ddl := IF(@chk_exists > 0,
  'ALTER TABLE forge_user_roles DROP CONSTRAINT chk_user_roles_active_slot',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
  SELECT COUNT(*) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles' AND INDEX_NAME = 'uq_user_roles_one_active'
);
SET @ddl := IF(@idx_exists > 0,
  'ALTER TABLE forge_user_roles DROP INDEX uq_user_roles_one_active',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_user_roles' AND COLUMN_NAME = 'active_slot'
);
SET @ddl := IF(@col_exists > 0,
  'ALTER TABLE forge_user_roles DROP COLUMN active_slot',
  'DO 0'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO forge_roles (slug, name, description, is_view_only, sort_order) VALUES
  ('network-member', 'Network Member', 'Member of the ATLAS Forge network', FALSE, 6)
ON DUPLICATE KEY UPDATE name = VALUES(name);
