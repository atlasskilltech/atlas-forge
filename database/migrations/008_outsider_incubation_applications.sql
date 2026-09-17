-- ===========================================================================
-- 008 · Outsider incubation applications — the public "Apply for incubation"
--
--   npm run db:migrate migrations/008_outsider_incubation_applications.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- The landing page (`/`) lets someone with NO account apply for incubation.
-- That submission lives here and only here until a Forge Manager decides:
--
--   public submit  → one row here, status 'pending'
--   reject         → this row becomes 'rejected'; nothing else is written
--   approve        → this row becomes 'approved' AND, in the same transaction,
--                    the normal internal records are created (users,
--                    user_roles, startups, startup_members,
--                    incubation_applications, application_readiness,
--                    founder_access_grants). The ids of what was created are
--                    written back to the three `approved_*` / `incubation_*`
--                    columns below, so the audit trail runs both ways.
--
-- The signed-in Founder flow (`/founder/incubation`, `incubation_applications`)
-- is untouched by this file.
--
-- Column choices:
--
--   * `reference` is a random, non-sequential code shown to the applicant
--     (e.g. AFI-2026-7K3M9Q). Random rather than derived from `id` so the
--     public number does not reveal how many applications exist.
--   * `industry_id` / `stage_id` point at the same lookup tables the Founder
--     form uses, so approval copies them across without translation.
--   * The four readiness answers are columns rather than a JSON blob: two are
--     mandatory for this form (NOT NULL enforces it at the last line of
--     defence), and VARCHAR(500) matches `application_readiness.value`, which
--     is where approval copies them.
--   * `startup_logo_url` holds '/uploads/startup-logos/<sha256>.<ext>' — the
--     same URL shape `startups.logo_url` stores, so approval copies the value
--     and never the file.
--   * `phone` exists only here: `users` has no phone column and this migration
--     does not add one.
--   * `source_ip` / `user_agent` feed the per-address throttle and triage,
--     exactly as on `service_requests`.
--
-- Adds ONE table. NO existing table is altered, and no existing row is
-- modified or deleted. Foreign keys only point OUT of this table.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS only.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS outsider_incubation_applications (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference                 VARCHAR(24)     NOT NULL,

  -- Applicant
  full_name                 VARCHAR(160)    NOT NULL,
  email                     VARCHAR(190)    NOT NULL,
  phone                     VARCHAR(32)     NOT NULL,

  -- Startup
  startup_name              VARCHAR(160)    NOT NULL,
  tagline                   VARCHAR(255)    NULL DEFAULT NULL,
  problem_statement         TEXT            NULL,
  industry_id               BIGINT UNSIGNED NULL DEFAULT NULL,
  stage_id                  BIGINT UNSIGNED NULL DEFAULT NULL,
  startup_logo_url          VARCHAR(255)    NULL DEFAULT NULL,

  -- Readiness
  pitch_deck                VARCHAR(500)    NOT NULL,
  product_demo              VARCHAR(500)    NULL DEFAULT NULL,
  product_assets            VARCHAR(500)    NULL DEFAULT NULL,
  key_personnel             VARCHAR(500)    NOT NULL,

  -- Review
  status                    ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by               BIGINT UNSIGNED NULL DEFAULT NULL,
  reviewed_at               TIMESTAMP       NULL DEFAULT NULL,
  rejection_reason          VARCHAR(1000)   NULL DEFAULT NULL,

  -- What approval created in the internal system (NULL until approved)
  approved_user_id          BIGINT UNSIGNED NULL DEFAULT NULL,
  approved_startup_id       BIGINT UNSIGNED NULL DEFAULT NULL,
  incubation_application_id BIGINT UNSIGNED NULL DEFAULT NULL,

  source_ip                 VARCHAR(45)     NOT NULL DEFAULT '',
  user_agent                VARCHAR(255)    NULL DEFAULT NULL,
  created_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_outsider_incubation_reference (reference),
  -- The review queue: filtered by status, newest first.
  KEY idx_outsider_incubation_status (status, created_at),
  KEY idx_outsider_incubation_created (created_at),
  -- Serves the "already have a pending application" guard.
  KEY idx_outsider_incubation_email (email, status),
  -- Serves the per-IP throttle.
  KEY idx_outsider_incubation_ip (source_ip, created_at),
  KEY idx_outsider_incubation_industry (industry_id),
  KEY idx_outsider_incubation_stage (stage_id),
  KEY idx_outsider_incubation_reviewer (reviewed_by),
  KEY idx_outsider_incubation_user (approved_user_id),
  KEY idx_outsider_incubation_startup (approved_startup_id),
  KEY idx_outsider_incubation_application (incubation_application_id),

  CONSTRAINT fk_outsider_incubation_industry FOREIGN KEY (industry_id)
    REFERENCES industries (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_outsider_incubation_stage FOREIGN KEY (stage_id)
    REFERENCES stages (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_outsider_incubation_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_outsider_incubation_user FOREIGN KEY (approved_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_outsider_incubation_startup FOREIGN KEY (approved_startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_outsider_incubation_application FOREIGN KEY (incubation_application_id)
    REFERENCES incubation_applications (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- Verify
--
--   SHOW TABLES LIKE 'outsider_incubation_applications';
--   DESCRIBE outsider_incubation_applications;              -- 26 columns
--   SELECT COUNT(*) FROM outsider_incubation_applications;  -- 0 until the first submission
-- ===========================================================================
