-- ===========================================================================
-- 003 · Contract types offered on Post a Job
--
--   npm run db:migrate migrations/003_job_contract_types.sql
--
-- Post a Job now offers two contract types instead of four:
--
--   Paid Work / Academic Credit
--   Equity / Revenue Share / Co-founder Role
--
-- These are ADDED as new rows rather than renamed over the existing four.
-- `contract_types` is a shared lookup: `listings.contract_type_id` points into
-- it, and Post a Collab draws its engagement options from the same table. So
-- renaming `paid-freelance` or `equity` in place would silently relabel every
-- listing already posted under them and change a student form this migration
-- has no business touching. Appending leaves that history intact.
--
-- The four original rows stay active and keep their sort_order. Which subset a
-- given form offers is a decision the form makes, not the table -- Post a Job
-- selects these two by slug (JOB_CONTRACT_SLUGS), exactly as Post a Collab
-- already selects its three (COLLAB_CONTRACT_SLUGS).
--
-- Idempotent: re-running only rewrites name/sort_order to the same values.
-- Safe on a populated table -- no existing row and no FK changes.
-- ===========================================================================

INSERT INTO contract_types (slug, name, sort_order) VALUES
  ('paid-academic-credit', 'Paid Work / Academic Credit',             5),
  ('equity-cofounder',     'Equity / Revenue Share / Co-founder Role', 6)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);
