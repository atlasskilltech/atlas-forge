-- ===========================================================================
-- 005 · Alumni mentors from the 2026 alumni mentorship form
--
--   npm run db:migrate migrations/005_alumni_mentors.sql
--   node --env-file=.env.local scripts/import-alumni-mentors.mjs --commit
--
-- Adds the profile fields an alumni mentor needs, and the mentorship-area
-- vocabulary the form collected, to the EXISTING mentors system. There is no
-- new parallel "alumni" table: `mentors.user_id` is already nullable for
-- exactly this case ("external mentors need not hold a platform account"), and
-- `mentor_types` already ships an `alumni` row. Importing as mentors means
-- assign-mentors, `mentorship_sessions` and `startups.mentor_id` keep working
-- with no change to the mentorship workflow.
--
-- Every column is NULL-able, so the mentors already in the table are untouched
-- and stay valid. Nothing is renamed, retyped or deleted.
--
-- `email`, `phone` and `linkedin_url` are STAFF-ONLY. They are stored here for
-- the Forge Manager; the founder-facing directory reads a separate statement
-- that does not select them at all — see SELECT_ALUMNI_MENTOR_DIRECTORY in
-- src/lib/queries/mentorship.js. Consent covers storage for alumni-network
-- purposes, which is why `consent_at` is recorded alongside them.
--
-- Idempotent on MySQL 8 and MariaDB: the column set is added by ONE ALTER
-- guarded on a single sentinel column, so it is all-or-nothing and re-running
-- changes nothing. `ADD COLUMN IF NOT EXISTS` is MariaDB-only and is not used.
-- ===========================================================================

-- ---- 1. Alumni profile fields on `mentors` --------------------------------
-- `role_title` rather than `current_role`: CURRENT_ROLE is a reserved word in
-- both MySQL 8 and MariaDB, and `startup_members.role_title` already sets the
-- naming precedent. Role and company stay in one column because the form
-- collected them in one field with no consistent separator.
--
-- `industry` is free text, not a foreign key to `industries`: the form's
-- vocabulary (Consulting, Technology, Manufacturing) does not overlap the
-- platform's startup sectors, and forcing a mapping would put wrong values in
-- a lookup that drives startup filtering.
SET @add_alumni_columns = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'mentors'
         AND COLUMN_NAME  = 'email'
    ),
    'SELECT 1',
    'ALTER TABLE mentors
       ADD COLUMN email                  VARCHAR(255)      NULL DEFAULT NULL AFTER full_name,
       ADD COLUMN phone                  VARCHAR(32)       NULL DEFAULT NULL AFTER email,
       ADD COLUMN linkedin_url           VARCHAR(255)      NULL DEFAULT NULL AFTER phone,
       ADD COLUMN role_title             VARCHAR(160)      NULL DEFAULT NULL AFTER linkedin_url,
       ADD COLUMN city                   VARCHAR(120)      NULL DEFAULT NULL AFTER role_title,
       ADD COLUMN course                 VARCHAR(160)      NULL DEFAULT NULL AFTER city,
       ADD COLUMN graduation_year        SMALLINT UNSIGNED NULL DEFAULT NULL AFTER course,
       ADD COLUMN industry               VARCHAR(96)       NULL DEFAULT NULL AFTER graduation_year,
       ADD COLUMN experience_band        VARCHAR(16)       NULL DEFAULT NULL AFTER industry,
       ADD COLUMN mentoring_availability VARCHAR(16)       NULL DEFAULT NULL AFTER experience_band,
       ADD COLUMN import_source          VARCHAR(64)       NULL DEFAULT NULL AFTER mentoring_availability,
       ADD COLUMN consent_at             DATETIME          NULL DEFAULT NULL AFTER import_source'
  )
);
PREPARE add_alumni_columns FROM @add_alumni_columns;
EXECUTE add_alumni_columns;
DEALLOCATE PREPARE add_alumni_columns;

-- ---- 2. Email as the import's natural key ---------------------------------
-- MySQL and MariaDB both allow repeated NULLs in a UNIQUE index, so mentors
-- entered by hand keep their NULL email and coexist under this key. It is what
-- lets the import run twice without creating a second copy of anybody, the
-- same way `uq_mentors_user` already tolerates many NULL user_ids.
SET @add_email_key = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'mentors'
         AND INDEX_NAME   = 'uq_mentors_email'
    ),
    'SELECT 1',
    'ALTER TABLE mentors ADD UNIQUE KEY uq_mentors_email (email)'
  )
);
PREPARE add_email_key FROM @add_email_key;
EXECUTE add_email_key;
DEALLOCATE PREPARE add_email_key;

-- ---- 3. The mentorship-area vocabulary ------------------------------------
-- A lookup of its own rather than rows in `skills`: the skills catalogue is
-- fine-grained ("Figma", "UI/UX") and drives student-to-listing matching,
-- while these are ten coarse buckets a mentor picks from. Merging them would
-- put "Career & Personal Development" in the student skills picker.
CREATE TABLE IF NOT EXISTS mentorship_areas (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(96)       NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mentorship_areas_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Which areas a mentor covers. Same shape as `mentor_skills`; the composite
-- primary key is what makes re-importing a mentor's areas a no-op.
CREATE TABLE IF NOT EXISTS mentor_mentorship_areas (
  mentor_id  BIGINT UNSIGNED NOT NULL,
  area_id    BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mentor_id, area_id),
  KEY idx_mentor_areas_area (area_id),
  CONSTRAINT fk_mentor_areas_mentor FOREIGN KEY (mentor_id)
    REFERENCES mentors (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mentor_areas_area FOREIGN KEY (area_id)
    REFERENCES mentorship_areas (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---- 4. The ten areas the form offered ------------------------------------
-- Ordered by how many alumni chose each, so the busiest filter sits first.
-- 'sector-specific' is stored under its short display name; the form's
-- parenthetical list (Fintech, Edtech, Healthtech, ...) is helper text rather
-- than part of the category name, and would overflow VARCHAR(96).
INSERT INTO mentorship_areas (slug, name, sort_order) VALUES
  ('design-creative',         'Design & Creative',             1),
  ('business-strategy',       'Business & Strategy',           2),
  ('career-development',      'Career & Personal Development', 3),
  ('marketing-growth',        'Marketing & Growth',            4),
  ('product-technology',      'Product & Technology',          5),
  ('sales-bizdev',            'Sales & Business Development',  6),
  ('hr-culture',              'HR & Culture',                  7),
  ('finance-fundraising',     'Finance & Fundraising',         8),
  ('operations-supply-chain', 'Operations & Supply Chain',     9),
  ('sector-specific',         'Sector-specific',              10)
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order);
