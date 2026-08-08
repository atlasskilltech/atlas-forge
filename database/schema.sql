-- ===========================================================================
-- ATLAS Forge — complete database schema
--
--   Target : MySQL 8 / MariaDB 10.4+
--   Engine : InnoDB   Charset: utf8mb4   Collation: utf8mb4_unicode_ci
--
--   Run with:  npm run db:schema
--
-- WARNING — DESTRUCTIVE. This is a full rebuild: it drops every table listed
-- below before recreating it. Use it to bootstrap or reset an environment,
-- never to patch a populated database. Incremental changes belong in
-- database/migrations/.
-- ===========================================================================

ALTER DATABASE `atlas-forge-dashboard`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `atlas-forge-dashboard`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS error_logs;
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS platform_settings;
DROP TABLE IF EXISTS contracts;
DROP TABLE IF EXISTS founder_access_grants;
DROP TABLE IF EXISTS application_readiness;
DROP TABLE IF EXISTS incubation_applications;
DROP TABLE IF EXISTS readiness_items;
DROP TABLE IF EXISTS mentorship_sessions;
DROP TABLE IF EXISTS mentorship_requests;
DROP TABLE IF EXISTS mentor_skills;
DROP TABLE IF EXISTS mentors;
DROP TABLE IF EXISTS mentor_types;
DROP TABLE IF EXISTS posted_needs;
DROP TABLE IF EXISTS concierge_contacts;
DROP TABLE IF EXISTS approvals;
DROP TABLE IF EXISTS application_events;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS listing_skills;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS contract_types;
DROP TABLE IF EXISTS listing_types;
DROP TABLE IF EXISTS startup_members;
DROP TABLE IF EXISTS startups;
DROP TABLE IF EXISTS stages;
DROP TABLE IF EXISTS industries;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS sessions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;


-- ===========================================================================
-- 1 · IDENTITY & ACCESS CONTROL
-- ===========================================================================

CREATE TABLE roles (
  id            BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug          VARCHAR(64)       NOT NULL,
  name          VARCHAR(120)      NOT NULL,
  description   VARCHAR(255)      NULL,
  is_view_only  BOOLEAN           NOT NULL DEFAULT FALSE,
  sort_order    SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active     BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE permissions (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug        VARCHAR(96)     NOT NULL,
  name        VARCHAR(120)    NOT NULL,
  module      VARCHAR(64)     NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_permissions_slug (slug),
  KEY idx_permissions_module (module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role_permissions (
  role_id       BIGINT UNSIGNED NOT NULL,
  permission_id BIGINT UNSIGNED NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  KEY idx_role_permissions_permission (permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id)
    REFERENCES roles (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id)
    REFERENCES permissions (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  app_id         VARCHAR(32)     NOT NULL,
  full_name      VARCHAR(160)    NOT NULL,
  email          VARCHAR(255)    NOT NULL,
  password_hash  VARCHAR(255)    NOT NULL,
  initials       VARCHAR(4)      NULL,
  avatar_tone    VARCHAR(16)     NOT NULL DEFAULT 'primary',
  bio            TEXT            NULL,
  status         ENUM('active','inactive','suspended') NOT NULL DEFAULT 'active',
  last_active_at TIMESTAMP       NULL DEFAULT NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_app_id (app_id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_status (status),
  KEY idx_users_last_active (last_active_at),
  KEY idx_users_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Multiple roles per user. `revoked_at` rather than a delete: losing a role is
-- a business event we must retain.
CREATE TABLE user_roles (
  user_id    BIGINT UNSIGNED NOT NULL,
  role_id    BIGINT UNSIGNED NOT NULL,
  is_primary BOOLEAN         NOT NULL DEFAULT FALSE,
  granted_by BIGINT UNSIGNED NULL,
  granted_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  KEY idx_user_roles_active (user_id, revoked_at),
  KEY idx_user_roles_granted_by (granted_by),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id)
    REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_user_roles_granted_by FOREIGN KEY (granted_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- active_role_id records the role chosen on the Role Select screen.
CREATE TABLE sessions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NOT NULL,
  active_role_id BIGINT UNSIGNED NULL,
  token_hash     CHAR(64)        NOT NULL,
  ip_address     VARBINARY(16)   NULL,
  user_agent     VARCHAR(255)    NULL,
  expires_at     TIMESTAMP       NOT NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_sessions_token (token_hash),
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  KEY idx_sessions_role (active_role_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_sessions_role FOREIGN KEY (active_role_id)
    REFERENCES roles (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 2 · STUDENT DOMAIN
-- ===========================================================================

CREATE TABLE skills (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)     NOT NULL,
  name       VARCHAR(96)     NOT NULL,
  category   VARCHAR(48)     NULL,
  is_active  BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_slug (slug),
  KEY idx_skills_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_profiles (
  user_id             BIGINT UNSIGNED  NOT NULL,
  programme           VARCHAR(120)     NULL,
  year_of_study       TINYINT UNSIGNED NULL,
  hours_per_week      TINYINT UNSIGNED NULL,
  work_types          VARCHAR(255)     NULL,
  availability_timing VARCHAR(255)     NULL,
  is_available        BOOLEAN          NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  KEY idx_student_profiles_available (is_available),
  CONSTRAINT fk_student_profiles_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT chk_student_hours CHECK (hours_per_week IS NULL OR hours_per_week BETWEEN 0 AND 168)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE student_skills (
  user_id    BIGINT UNSIGNED NOT NULL,
  skill_id   BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, skill_id),
  KEY idx_student_skills_skill (skill_id),
  CONSTRAINT fk_student_skills_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_student_skills_skill FOREIGN KEY (skill_id)
    REFERENCES skills (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 3 · STARTUP DOMAIN
-- ===========================================================================

CREATE TABLE industries (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(96)       NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_industries_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE stages (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(96)       NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_stages_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- mentor_id's foreign key is added after `mentors` exists (circular reference).
CREATE TABLE startups (
  id                BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug              VARCHAR(96)       NOT NULL,
  name              VARCHAR(160)      NOT NULL,
  tagline           VARCHAR(255)      NULL,
  problem_statement TEXT              NULL,
  industry_id       BIGINT UNSIGNED   NULL,
  stage_id          BIGINT UNSIGNED   NULL,
  owner_user_id     BIGINT UNSIGNED   NULL,
  mentor_id         BIGINT UNSIGNED   NULL,
  is_hiring         BOOLEAN           NOT NULL DEFAULT FALSE,
  open_roles        SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_featured       BOOLEAN           NOT NULL DEFAULT FALSE,
  status            ENUM('pending','under_review','active','inactive') NOT NULL DEFAULT 'pending',
  initial           VARCHAR(4)        NULL,
  avatar_tone       VARCHAR(16)       NOT NULL DEFAULT 'primary',
  created_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP         NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_startups_slug (slug),
  KEY idx_startups_status (status),
  KEY idx_startups_industry (industry_id),
  KEY idx_startups_stage (stage_id),
  KEY idx_startups_owner (owner_user_id),
  KEY idx_startups_mentor (mentor_id),
  KEY idx_startups_featured (is_featured),
  KEY idx_startups_deleted (deleted_at),
  CONSTRAINT fk_startups_industry FOREIGN KEY (industry_id)
    REFERENCES industries (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_startups_stage FOREIGN KEY (stage_id)
    REFERENCES stages (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_startups_owner FOREIGN KEY (owner_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_startups_open_roles CHECK (open_roles >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE startup_members (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  startup_id BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  role_title VARCHAR(120)    NOT NULL,
  joined_at  DATE            NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_startup_members (startup_id, user_id),
  KEY idx_startup_members_user (user_id),
  CONSTRAINT fk_startup_members_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_startup_members_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 4 · LISTINGS & APPLICATIONS
-- ===========================================================================

CREATE TABLE listing_types (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(96)       NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_listing_types_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE contract_types (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(96)       NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contract_types_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs and collab posts share this table via `type`. startup_id is NULL for a
-- student collab post, which has no startup behind it.
CREATE TABLE listings (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  type              ENUM('job','collab') NOT NULL DEFAULT 'job',
  title             VARCHAR(160)    NOT NULL,
  description       TEXT            NULL,
  startup_id        BIGINT UNSIGNED NULL,
  created_by        BIGINT UNSIGNED NOT NULL,
  listing_type_id   BIGINT UNSIGNED NULL,
  contract_type_id  BIGINT UNSIGNED NULL,
  compensation      VARCHAR(255)    NULL,
  collaborator_need VARCHAR(255)    NULL,
  status            ENUM('draft','pending','live','rejected','closed') NOT NULL DEFAULT 'pending',
  posted_at         TIMESTAMP       NULL DEFAULT NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_listings_status_type (status, type),
  KEY idx_listings_startup (startup_id),
  KEY idx_listings_created_by (created_by),
  KEY idx_listings_posted (posted_at),
  KEY idx_listings_deleted (deleted_at),
  KEY idx_listings_listing_type (listing_type_id),
  KEY idx_listings_contract_type (contract_type_id),
  CONSTRAINT fk_listings_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_listings_created_by FOREIGN KEY (created_by)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_listings_listing_type FOREIGN KEY (listing_type_id)
    REFERENCES listing_types (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_listings_contract_type FOREIGN KEY (contract_type_id)
    REFERENCES contract_types (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_skills (
  listing_id BIGINT UNSIGNED NOT NULL,
  skill_id   BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (listing_id, skill_id),
  KEY idx_listing_skills_skill (skill_id),
  CONSTRAINT fk_listing_skills_listing FOREIGN KEY (listing_id)
    REFERENCES listings (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_listing_skills_skill FOREIGN KEY (skill_id)
    REFERENCES skills (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE applications (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id        BIGINT UNSIGNED NOT NULL,
  applicant_user_id BIGINT UNSIGNED NOT NULL,
  -- `selected` is last because migration 001 appended it: MySQL stores ENUM
  -- values by ordinal, so inserting it mid-list would have remapped existing
  -- rows. A fresh install keeps the same order as a migrated one.
  status            ENUM('applied','under_review','shortlisted','interview','not_selected','withdrawn','selected')
                    NOT NULL DEFAULT 'applied',
  cover_note        TEXT            NULL,
  applied_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_applications_listing_user (listing_id, applicant_user_id),
  KEY idx_applications_user (applicant_user_id),
  KEY idx_applications_status (status),
  CONSTRAINT fk_applications_listing FOREIGN KEY (listing_id)
    REFERENCES listings (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_applications_user FOREIGN KEY (applicant_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append-only status history.
CREATE TABLE application_events (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id BIGINT UNSIGNED NOT NULL,
  from_status    VARCHAR(32)     NULL,
  to_status      VARCHAR(32)     NOT NULL,
  changed_by     BIGINT UNSIGNED NULL,
  note           VARCHAR(255)    NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_application_events_app (application_id, created_at),
  KEY idx_application_events_user (changed_by),
  CONSTRAINT fk_application_events_app FOREIGN KEY (application_id)
    REFERENCES applications (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_application_events_user FOREIGN KEY (changed_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 5 · APPROVALS
-- One decision per (listing, deciding role) — this is what lets the Backend
-- Manager queue show the Forge Manager's decision alongside its own override.
-- ===========================================================================

CREATE TABLE approvals (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id         BIGINT UNSIGNED NOT NULL,
  decided_as_role_id BIGINT UNSIGNED NOT NULL,
  decision           ENUM('approved','rejected') NOT NULL,
  decided_by         BIGINT UNSIGNED NULL,
  reason             VARCHAR(255)    NULL,
  is_override        BOOLEAN         NOT NULL DEFAULT FALSE,
  decided_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_approvals_listing_role (listing_id, decided_as_role_id),
  KEY idx_approvals_decided_by (decided_by),
  KEY idx_approvals_role (decided_as_role_id),
  CONSTRAINT fk_approvals_listing FOREIGN KEY (listing_id)
    REFERENCES listings (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_role FOREIGN KEY (decided_as_role_id)
    REFERENCES roles (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_approvals_user FOREIGN KEY (decided_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 6 · CONCIERGE
-- ===========================================================================

CREATE TABLE concierge_contacts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  founder_user_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  startup_id      BIGINT UNSIGNED NULL,
  context         VARCHAR(255)    NOT NULL,
  duration_label  VARCHAR(64)     NULL,
  message         TEXT            NULL,
  cc_user_id      BIGINT UNSIGNED NULL,
  status          ENUM('pending','ongoing','done') NOT NULL DEFAULT 'pending',
  contacted_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_concierge_founder (founder_user_id, contacted_at),
  KEY idx_concierge_student (student_user_id),
  KEY idx_concierge_status (status),
  KEY idx_concierge_startup (startup_id),
  KEY idx_concierge_cc (cc_user_id),
  CONSTRAINT fk_concierge_founder FOREIGN KEY (founder_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_concierge_student FOREIGN KEY (student_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_concierge_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_concierge_cc FOREIGN KEY (cc_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE posted_needs (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  founder_user_id BIGINT UNSIGNED NOT NULL,
  startup_id      BIGINT UNSIGNED NULL,
  title           VARCHAR(160)    NOT NULL,
  description     TEXT            NULL,
  status          ENUM('open','filled','closed') NOT NULL DEFAULT 'open',
  posted_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_posted_needs_founder (founder_user_id),
  KEY idx_posted_needs_status (status),
  KEY idx_posted_needs_startup (startup_id),
  CONSTRAINT fk_posted_needs_founder FOREIGN KEY (founder_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_posted_needs_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 7 · MENTORSHIP
-- ===========================================================================

CREATE TABLE mentor_types (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(96)       NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mentor_types_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_id is nullable: external mentors need not hold a platform account.
CREATE TABLE mentors (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        BIGINT UNSIGNED NULL,
  full_name      VARCHAR(160)    NOT NULL,
  mentor_type_id BIGINT UNSIGNED NOT NULL,
  initials       VARCHAR(4)      NULL,
  avatar_tone    VARCHAR(16)     NOT NULL DEFAULT 'primary',
  is_primary     BOOLEAN         NOT NULL DEFAULT FALSE,
  is_active      BOOLEAN         NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mentors_user (user_id),
  KEY idx_mentors_type (mentor_type_id),
  CONSTRAINT fk_mentors_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mentors_type FOREIGN KEY (mentor_type_id)
    REFERENCES mentor_types (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Deferred FK: startups and mentors reference each other.
ALTER TABLE startups
  ADD CONSTRAINT fk_startups_mentor FOREIGN KEY (mentor_id)
    REFERENCES mentors (id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE mentor_skills (
  mentor_id  BIGINT UNSIGNED NOT NULL,
  skill_id   BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (mentor_id, skill_id),
  KEY idx_mentor_skills_skill (skill_id),
  CONSTRAINT fk_mentor_skills_mentor FOREIGN KEY (mentor_id)
    REFERENCES mentors (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_mentor_skills_skill FOREIGN KEY (skill_id)
    REFERENCES skills (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mentorship_requests (
  id                       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  requester_user_id        BIGINT UNSIGNED NOT NULL,
  startup_id               BIGINT UNSIGNED NULL,
  topic                    VARCHAR(255)    NOT NULL,
  context                  TEXT            NULL,
  preferred_mentor_type_id BIGINT UNSIGNED NULL,
  preferred_timing         VARCHAR(160)    NULL,
  status                   ENUM('requested','assigned','cancelled') NOT NULL DEFAULT 'requested',
  created_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at               TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_mentorship_requests_user (requester_user_id),
  KEY idx_mentorship_requests_status (status),
  KEY idx_mentorship_requests_startup (startup_id),
  KEY idx_mentorship_requests_type (preferred_mentor_type_id),
  CONSTRAINT fk_mentorship_requests_user FOREIGN KEY (requester_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_mentorship_requests_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_mentorship_requests_type FOREIGN KEY (preferred_mentor_type_id)
    REFERENCES mentor_types (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mentorship_sessions (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_id     BIGINT UNSIGNED NULL,
  mentor_id      BIGINT UNSIGNED NULL,
  mentee_user_id BIGINT UNSIGNED NOT NULL,
  startup_id     BIGINT UNSIGNED NULL,
  topic          VARCHAR(255)    NOT NULL,
  scheduled_at   DATETIME        NULL,
  assigned_by    BIGINT UNSIGNED NULL,
  status         ENUM('requested','upcoming','completed','cancelled') NOT NULL DEFAULT 'requested',
  notes          TEXT            NULL,
  created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at     TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_ms_mentee (mentee_user_id),
  KEY idx_ms_mentor (mentor_id),
  KEY idx_ms_status_time (status, scheduled_at),
  KEY idx_ms_request (request_id),
  KEY idx_ms_startup (startup_id),
  KEY idx_ms_assigned_by (assigned_by),
  CONSTRAINT fk_ms_request FOREIGN KEY (request_id)
    REFERENCES mentorship_requests (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ms_mentor FOREIGN KEY (mentor_id)
    REFERENCES mentors (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ms_mentee FOREIGN KEY (mentee_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ms_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ms_assigned_by FOREIGN KEY (assigned_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 8 · INCUBATION
-- ===========================================================================

CREATE TABLE readiness_items (
  id         BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug       VARCHAR(64)       NOT NULL,
  name       VARCHAR(120)      NOT NULL,
  hint       VARCHAR(255)      NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active  BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_readiness_items_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE incubation_applications (
  id                BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT,
  applicant_user_id BIGINT UNSIGNED  NOT NULL,
  startup_id        BIGINT UNSIGNED  NULL,
  idea_name         VARCHAR(160)     NOT NULL,
  problem_statement TEXT             NULL,
  stage_id          BIGINT UNSIGNED  NULL,
  team_member_ids   VARCHAR(500)     NULL,
  status            ENUM('draft','pending','under_review','approved','rejected') NOT NULL DEFAULT 'draft',
  completion_pct    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  submitted_at      TIMESTAMP        NULL DEFAULT NULL,
  reviewed_by       BIGINT UNSIGNED  NULL,
  reviewed_at       TIMESTAMP        NULL DEFAULT NULL,
  created_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP        NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_incubation_applicant (applicant_user_id),
  KEY idx_incubation_status (status),
  KEY idx_incubation_startup (startup_id),
  KEY idx_incubation_stage (stage_id),
  KEY idx_incubation_reviewer (reviewed_by),
  CONSTRAINT fk_incubation_applicant FOREIGN KEY (applicant_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_incubation_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_incubation_stage FOREIGN KEY (stage_id)
    REFERENCES stages (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_incubation_reviewer FOREIGN KEY (reviewed_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT chk_incubation_pct CHECK (completion_pct BETWEEN 0 AND 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per checklist item per application. The readiness ring is
-- COUNT(value IS NOT NULL) / COUNT(active readiness_items).
CREATE TABLE application_readiness (
  application_id    BIGINT UNSIGNED NOT NULL,
  readiness_item_id BIGINT UNSIGNED NOT NULL,
  value             VARCHAR(500)    NULL,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (application_id, readiness_item_id),
  KEY idx_app_readiness_item (readiness_item_id),
  CONSTRAINT fk_app_readiness_app FOREIGN KEY (application_id)
    REFERENCES incubation_applications (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_app_readiness_item FOREIGN KEY (readiness_item_id)
    REFERENCES readiness_items (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE founder_access_grants (
  id                        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id                   BIGINT UNSIGNED NOT NULL,
  startup_id                BIGINT UNSIGNED NULL,
  incubation_application_id BIGINT UNSIGNED NULL,
  granted_by                BIGINT UNSIGNED NULL,
  granted_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_by                BIGINT UNSIGNED NULL,
  revoked_at                TIMESTAMP       NULL DEFAULT NULL,
  reason                    VARCHAR(255)    NULL,
  created_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at                TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_grants_user (user_id, revoked_at),
  KEY idx_grants_startup (startup_id),
  KEY idx_grants_application (incubation_application_id),
  KEY idx_grants_granted_by (granted_by),
  KEY idx_grants_revoked_by (revoked_by),
  CONSTRAINT fk_grants_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_grants_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grants_application FOREIGN KEY (incubation_application_id)
    REFERENCES incubation_applications (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grants_granted_by FOREIGN KEY (granted_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_grants_revoked_by FOREIGN KEY (revoked_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ===========================================================================
-- 9 · PLATFORM OPERATIONS
-- ===========================================================================

CREATE TABLE contracts (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  listing_id      BIGINT UNSIGNED NULL,
  startup_id      BIGINT UNSIGNED NULL,
  founder_user_id BIGINT UNSIGNED NOT NULL,
  student_user_id BIGINT UNSIGNED NOT NULL,
  title           VARCHAR(160)    NOT NULL,
  terms           TEXT            NULL,
  status          ENUM('draft','active','completed','cancelled') NOT NULL DEFAULT 'draft',
  started_at      DATE            NULL,
  ended_at        DATE            NULL,
  created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at      TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_contracts_founder (founder_user_id),
  KEY idx_contracts_student (student_user_id),
  KEY idx_contracts_status (status),
  KEY idx_contracts_listing (listing_id),
  KEY idx_contracts_startup (startup_id),
  CONSTRAINT fk_contracts_listing FOREIGN KEY (listing_id)
    REFERENCES listings (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_contracts_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_contracts_founder FOREIGN KEY (founder_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_contracts_student FOREIGN KEY (student_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT chk_contracts_dates CHECK (ended_at IS NULL OR started_at IS NULL OR ended_at >= started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE platform_settings (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  setting_key   VARCHAR(96)     NOT NULL,
  setting_value TEXT            NULL,
  value_type    ENUM('string','boolean','number','json') NOT NULL DEFAULT 'string',
  group_key     VARCHAR(64)     NOT NULL DEFAULT 'general',
  label         VARCHAR(160)    NOT NULL,
  description   VARCHAR(255)    NULL,
  updated_by    BIGINT UNSIGNED NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_platform_settings_key (setting_key),
  KEY idx_platform_settings_group (group_key),
  KEY idx_platform_settings_user (updated_by),
  CONSTRAINT fk_platform_settings_user FOREIGN KEY (updated_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Append-only. No updated_at, no deleted_at — the audit trail is immutable.
CREATE TABLE activity_logs (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  actor_user_id BIGINT UNSIGNED NULL,
  action        VARCHAR(255)    NOT NULL,
  module        VARCHAR(64)     NOT NULL,
  entity_type   VARCHAR(64)     NULL,
  entity_id     BIGINT UNSIGNED NULL,
  status        ENUM('logged','success','action','pending','failed') NOT NULL DEFAULT 'logged',
  meta          JSON            NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_activity_created (created_at),
  KEY idx_activity_module_created (module, created_at),
  KEY idx_activity_actor (actor_user_id),
  KEY idx_activity_entity (entity_type, entity_id),
  CONSTRAINT fk_activity_actor FOREIGN KEY (actor_user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE error_logs (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  level       ENUM('warning','error','critical') NOT NULL DEFAULT 'error',
  message     VARCHAR(500)    NOT NULL,
  stack_trace TEXT            NULL,
  context     JSON            NULL,
  user_id     BIGINT UNSIGNED NULL,
  resolved_at TIMESTAMP       NULL DEFAULT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_error_logs_level_created (level, created_at),
  KEY idx_error_logs_resolved (resolved_at),
  KEY idx_error_logs_user (user_id),
  CONSTRAINT fk_error_logs_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notifications (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id      BIGINT UNSIGNED NOT NULL,
  type         VARCHAR(64)     NOT NULL,
  title        VARCHAR(255)    NOT NULL,
  body         VARCHAR(500)    NULL,
  link_url     VARCHAR(255)    NULL,
  entity_type  VARCHAR(64)     NULL,
  entity_id    BIGINT UNSIGNED NULL,
  read_at      TIMESTAMP       NULL DEFAULT NULL,
  dismissed_at TIMESTAMP       NULL DEFAULT NULL,
  created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notifications_user_unread (user_id, read_at),
  KEY idx_notifications_created (created_at),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE messages (
  id                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sender_user_id    BIGINT UNSIGNED NOT NULL,
  recipient_user_id BIGINT UNSIGNED NOT NULL,
  subject           VARCHAR(255)    NOT NULL,
  body              TEXT            NOT NULL,
  read_at           TIMESTAMP       NULL DEFAULT NULL,
  sent_at           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at        TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_messages_recipient (recipient_user_id, read_at),
  KEY idx_messages_sender (sender_user_id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_messages_recipient FOREIGN KEY (recipient_user_id)
    REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Authentication attempts
--
-- Feeds the login rate limiter. Added by migration 002 and repeated here so a
-- fresh `npm run db:schema` produces the same shape as a migrated database.
--
-- No foreign key to `users` on purpose: attempts against identifiers that do
-- not exist are precisely the ones worth recording.
-- ---------------------------------------------------------------------------
CREATE TABLE login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  identifier  VARCHAR(190)    NOT NULL,
  ip_address  VARCHAR(45)     NOT NULL DEFAULT '',
  action      VARCHAR(32)     NOT NULL DEFAULT 'login',
  succeeded   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_login_attempts_identifier (action, identifier, created_at),
  KEY idx_login_attempts_ip (action, ip_address, created_at),
  KEY idx_login_attempts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
