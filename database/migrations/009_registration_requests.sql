-- ===========================================================================
-- 009 · Registration requests — the public "Join the ATLAS Forge Network" form
--
--   npm run db:migrate migrations/009_registration_requests.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Reference: /reference/form/
--
-- The registration page (`/register`) lets someone with NO account register to
-- join the ATLAS Forge network. That submission lives here and only here until
-- a Forge Manager decides:
--
--   public submit  → one row here, status 'pending'   (no account, no access)
--   reject         → this row becomes 'rejected'; nothing else is written
--   approve        → this row becomes 'approved' AND, in the same transaction,
--                    a user account is created with the `network-member` role
--                    (Phases 5–6). The ids of what was created are written back
--                    to `approved_user_id` / `approved_role_id`, so the audit
--                    trail runs both ways.
--
-- Column choices:
--
--   * `reference` is a random, non-sequential code shown to the applicant
--     (e.g. AFN-2026-7K3M9Q). Random rather than derived from `id` so the
--     public number does not reveal how many registrations exist.
--   * `role_category` is the "Who are you?" answer. It is NOT a platform role —
--     every approved registrant gets the single `network-member` role. It only
--     records which set of questions the person answered.
--   * `details_json` holds the role-specific answers as one JSON document. The
--     fields differ heavily per role (Student has 4, Alumni ~20), and every
--     value is validated against `src/config/registration.js` in the service
--     layer before it is stored, so a column-per-field table would be mostly
--     NULLs with no added safety. Stored as LONGTEXT (always written via
--     JSON.stringify) for identical behaviour on MySQL 8 and MariaDB.
--   * `phone` exists only here: `users` has no phone column and this migration
--     does not add one.
--   * `source_ip` / `user_agent` feed the per-address throttle and triage,
--     exactly as on `service_requests` and `outsider_incubation_applications`.
--
-- Adds ONE table. NO existing table is altered, and no existing row is
-- modified or deleted. Foreign keys only point OUT of this table.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS only. Re-running is a no-op.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS registration_requests (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  reference          VARCHAR(24)     NOT NULL,

  -- Applicant (common fields, every role)
  full_name          VARCHAR(160)    NOT NULL,
  email              VARCHAR(190)    NOT NULL,
  phone              VARCHAR(32)     NULL DEFAULT NULL,

  -- Which question set they answered, and the answers to it
  role_category      ENUM('atlas_student','atlas_alumni','atlas_faculty','others') NOT NULL,
  details_json       LONGTEXT        NULL DEFAULT NULL,

  -- Consent to the privacy statement on the form
  consent            TINYINT(1)      NOT NULL DEFAULT 0,
  consented_at       TIMESTAMP       NULL DEFAULT NULL,

  -- Review
  status             ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by        BIGINT UNSIGNED NULL DEFAULT NULL,
  reviewed_at        TIMESTAMP       NULL DEFAULT NULL,
  rejection_reason   VARCHAR(1000)   NULL DEFAULT NULL,

  -- What approval created in the internal system (NULL until approved)
  approved_user_id   BIGINT UNSIGNED NULL DEFAULT NULL,
  approved_role_id   BIGINT UNSIGNED NULL DEFAULT NULL,

  source_ip          VARCHAR(45)     NOT NULL DEFAULT '',
  user_agent         VARCHAR(255)    NULL DEFAULT NULL,
  created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_registration_reference (reference),
  -- The review queue: filtered by status, newest first.
  KEY idx_registration_status (status, created_at),
  KEY idx_registration_created (created_at),
  -- Serves the "already have a pending registration" guard.
  KEY idx_registration_email (email, status),
  -- Serves the per-IP throttle.
  KEY idx_registration_ip (source_ip, created_at),
  KEY idx_registration_reviewer (reviewed_by),
  KEY idx_registration_user (approved_user_id),
  KEY idx_registration_role (approved_role_id),

  CONSTRAINT fk_registration_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_registration_user FOREIGN KEY (approved_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_registration_role FOREIGN KEY (approved_role_id)
    REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- Verify
--
--   SHOW TABLES LIKE 'registration_requests';
--   DESCRIBE registration_requests;                 -- 19 columns
--   SELECT COUNT(*) FROM registration_requests;     -- 0 until the first submission
-- ===========================================================================
