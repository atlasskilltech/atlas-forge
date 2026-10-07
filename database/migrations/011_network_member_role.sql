-- ===========================================================================
-- 011 · network-member role — the role approved registrants receive
--
--   npm run db:migrate migrations/011_network_member_role.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Approving a public "Join the ATLAS Forge Network" registration creates (or
-- attaches to) a user account and grants it THIS role — and only this role.
--
-- Seeded here rather than in database/reference-data.sql because that file runs
-- only on `db:reset`, which never happens on a live database. This migration
-- uses the same idempotent INSERT ... ON DUPLICATE KEY UPDATE pattern keyed on
-- the natural `slug`, so applying it to production adds the role without
-- disturbing the ids existing data references, and re-running only refreshes
-- its labels.
--
-- Permissions: NONE. The role is least-privilege by design — a member can sign
-- in, is forced to set a password, and reaches only its own `/member/home`
-- (a role check, no permission). It is deliberately given no Founder, Manager,
-- Admin, incubation, listing, startup, or user-management permission. When a
-- richer member experience is built, specific self-scoped permissions will be
-- added in a later migration.
--
-- Adds ONE role row. No existing role, permission, grant or user is modified.
-- Idempotent.
-- ===========================================================================

INSERT INTO roles (slug, name, description, is_view_only, sort_order) VALUES
  ('network-member', 'Network Member', 'Member of the ATLAS Forge network', FALSE, 6)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_view_only = VALUES(is_view_only),
  sort_order = VALUES(sort_order);

-- No role_permissions rows are inserted: see the note above.

-- ===========================================================================
-- Verify
--
--   SELECT id, slug, name, sort_order FROM roles WHERE slug = 'network-member';
--   SELECT COUNT(*) FROM role_permissions rp
--     JOIN roles r ON r.id = rp.role_id
--    WHERE r.slug = 'network-member';   -- 0 (no permissions by design)
-- ===========================================================================
