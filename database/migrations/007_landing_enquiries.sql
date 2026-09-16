-- ===========================================================================
-- 007 · Landing page enquiries — the two public forms on `/`
--
--   npm run db:migrate migrations/007_landing_enquiries.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Reference: /reference/landing-page/services.png
--            /reference/landing-page/Service required drop down.png
--            /reference/landing-page/Partner with us.png
--
-- Two tables, both fed by anonymous visitors. That is the single fact that
-- shapes everything below.
--
--   * No foreign key to `users`. The people who fill these in have no account
--     — that is the whole point of a public landing page — so a FK would make
--     the common case unstorable.
--   * No `deleted_at`. Every other table here soft-deletes because rows are
--     referenced elsewhere; an enquiry is a leaf record and `status` already
--     carries "dealt with".
--   * `source_ip` and `user_agent` are kept because they are the only handle
--     on a flood of junk submissions after the fact. `source_ip` is also read
--     live by the per-IP throttle in landing.service.js.
--
-- Adds two tables. NO existing table is altered, and no existing row is
-- modified or deleted.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS only.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. "How can we Help You?" — the Atlas Forge Services enquiry
--
-- `service_required` stores the slug of the chosen option, not its label, so
-- reworded copy on the landing page never invalidates stored rows. The
-- allowed slugs live in src/lib/services/landing.service.js and are validated
-- there; this column is deliberately a VARCHAR rather than an ENUM so adding
-- a service is a code change, not a schema migration on a live table.
--
-- `message` is NULL-able: the reference marks "Tell Us More" as the only
-- optional field on the form.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS service_requests (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name             VARCHAR(120)    NOT NULL,
  email            VARCHAR(190)    NOT NULL,
  phone            VARCHAR(32)     NOT NULL,
  service_required VARCHAR(64)     NOT NULL,
  message          TEXT            NULL DEFAULT NULL,
  status           ENUM('new','in_review','contacted','closed') NOT NULL DEFAULT 'new',
  source_ip        VARCHAR(45)     NOT NULL DEFAULT '',
  user_agent       VARCHAR(255)    NULL DEFAULT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- The inbox query: newest first, optionally filtered by status.
  KEY idx_service_requests_created (created_at),
  KEY idx_service_requests_status (status, created_at),
  -- Serves the duplicate check: "has this address written in the last hour".
  KEY idx_service_requests_email (email, created_at),
  -- Serves the per-IP throttle.
  KEY idx_service_requests_ip (source_ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. "Partner With ATLAS Forge" — the collaboration enquiry
--
-- Same shape minus the service picker, plus `company`. Kept as its own table
-- rather than a `type` column on the one above because the two forms collect
-- genuinely different fields, and a shared table would mean every row carries
-- a NULL for whichever half it is not.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS partner_requests (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(120)    NOT NULL,
  email       VARCHAR(190)    NOT NULL,
  phone       VARCHAR(32)     NOT NULL,
  company     VARCHAR(160)    NOT NULL,
  message     TEXT            NULL DEFAULT NULL,
  status      ENUM('new','in_review','contacted','closed') NOT NULL DEFAULT 'new',
  source_ip   VARCHAR(45)     NOT NULL DEFAULT '',
  user_agent  VARCHAR(255)    NULL DEFAULT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_partner_requests_created (created_at),
  KEY idx_partner_requests_status (status, created_at),
  KEY idx_partner_requests_email (email, created_at),
  KEY idx_partner_requests_ip (source_ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===========================================================================
-- Verify
--
--   SHOW TABLES LIKE '%_requests';            -- service_requests, partner_requests
--   DESCRIBE service_requests;                -- 11 columns
--   DESCRIBE partner_requests;                -- 11 columns
--   SELECT COUNT(*) FROM service_requests;    -- 0 until the first submission
--   SELECT COUNT(*) FROM partner_requests;    -- 0 until the first submission
-- ===========================================================================
