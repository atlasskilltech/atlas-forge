-- ===========================================================================
-- 006 · Compliance & Documents — the per-startup document vault
--
--   npm run db:migrate migrations/006_compliance_documents.sql
--   (or import this file through phpMyAdmin with charset utf8mb4)
--
-- Reference: /reference/mast ui/Compliance & Docs/1.png and 2.png
--
-- A startup has one current document per category, and replacing one keeps the
-- previous version rather than deleting it — these are legal records, and
-- "what did we hold in March" is a question that gets asked.
--
-- Ownership is `startup_id`, not the founder: the paperwork belongs to the
-- company and survives a founder handover. `startups.owner_user_id` already
-- resolves the founder when one is needed.
--
-- The files themselves live outside the database and outside `public/`, under
-- UPLOAD_DIR/startup-documents/<startupId>/<sha256>.<ext>, and are served only
-- by an authenticated route. Nothing here is reachable from a public URL.
--
-- Adds two tables and their reference rows. NO existing table is altered, and
-- no existing row is modified or deleted.
--
-- Idempotent: CREATE TABLE IF NOT EXISTS, and every INSERT is an upsert.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. The checklist itself
--
-- A lookup, shaped like `readiness_items` — the closest existing precedent,
-- which also pairs a name with an explanatory line.
--
-- `accepted_types` is a per-category extension allowlist rather than one rule
-- for the whole feature, because the reference shows two categories collecting
-- an archive of several files and the rest collecting a single PDF.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_categories (
  id             BIGINT UNSIGNED   NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(64)       NOT NULL,
  name           VARCHAR(120)      NOT NULL,
  -- Shown under the name. Only DPIIT carries one in the reference.
  description    VARCHAR(255)      NULL DEFAULT NULL,
  -- Drives the CORE / RECOMMENDED chip. 'core' is required of every startup in
  -- the programme; 'recommended' is expected but not blocking.
  tier           ENUM('core','recommended') NOT NULL DEFAULT 'recommended',
  -- Comma-separated extensions, lower case, no dots.
  accepted_types VARCHAR(64)       NOT NULL DEFAULT 'pdf',
  sort_order     SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active      BOOLEAN           NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_document_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 2. The uploaded files
--
-- One row per upload, not per slot. `is_current` marks the version a founder
-- sees and downloads; superseded rows stay with `replaced_at` set, which is
-- what makes Replace non-destructive.
--
-- There is deliberately no unique key on (startup_id, category_id): MySQL and
-- MariaDB cannot express "unique among current rows only" without a generated
-- column, and this schema uses none. The one-current-per-slot invariant is
-- enforced in a transaction in documents.service.js, the same way the listing
-- and approval invariants are.
--
-- `stored_name` is the SHA-256 of the contents plus an extension, so nothing a
-- founder types reaches the filesystem. `original_name` is what they uploaded
-- and what a download hands back.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS startup_documents (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  startup_id    BIGINT UNSIGNED NOT NULL,
  category_id   BIGINT UNSIGNED NOT NULL,
  stored_name   VARCHAR(128)    NOT NULL,
  original_name VARCHAR(255)    NOT NULL,
  mime_type     VARCHAR(128)    NOT NULL,
  byte_size     INT UNSIGNED    NOT NULL,
  checksum      CHAR(64)        NOT NULL,
  -- The person who uploaded it, kept for the audit trail. NULL once that
  -- account is removed — the document outlives the uploader.
  uploaded_by   BIGINT UNSIGNED NULL,
  is_current    BOOLEAN         NOT NULL DEFAULT TRUE,
  replaced_at   TIMESTAMP       NULL DEFAULT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at    TIMESTAMP       NULL DEFAULT NULL,
  PRIMARY KEY (id),
  -- The checklist query: every current document for one startup.
  KEY idx_startup_documents_slot (startup_id, category_id, is_current),
  KEY idx_startup_documents_category (category_id),
  KEY idx_startup_documents_uploader (uploaded_by),
  KEY idx_startup_documents_deleted (deleted_at),
  CONSTRAINT fk_startup_documents_startup FOREIGN KEY (startup_id)
    REFERENCES startups (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_startup_documents_category FOREIGN KEY (category_id)
    REFERENCES document_categories (id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_startup_documents_uploader FOREIGN KEY (uploaded_by)
    REFERENCES users (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- 3. The fourteen categories
--
-- Names, order and CORE/RECOMMENDED tier are copied from the reference
-- screenshots exactly. `accepted_types` follows the file extension each row
-- shows: PDF everywhere except the two categories the design collects as an
-- archive.
-- ---------------------------------------------------------------------------
INSERT INTO document_categories (slug, name, description, tier, accepted_types, sort_order) VALUES
  ('pitch-deck',                'Pitch Deck',                                       NULL, 'core',        'pdf',      1),
  ('incubation-agreement',      'Incubation Agreement',                             NULL, 'core',        'pdf',      2),
  ('dpiit-recognition',         'DPIIT Recognition Certificate',
     'Department for Promotion of Industry and Internal Trade',                           'core',        'pdf',      3),
  ('certificate-incorporation', 'Certificate of Incorporation',                     NULL, 'core',        'pdf',      4),
  ('gst-registration',          'GST Registration Certificate',                     NULL, 'core',        'pdf',      5),
  ('business-pan',              'Business PAN Card',                                NULL, 'core',        'pdf',      6),
  ('founders-agreement',        'Founders'' Agreement',                             NULL, 'recommended', 'pdf',      7),
  ('moa-aoa',                   'Memorandum & Articles of Association (MoA & AoA)', NULL, 'recommended', 'pdf',      8),
  ('shareholders-agreement',    'Shareholders'' Agreement',                         NULL, 'recommended', 'pdf',      9),
  ('ip-trademark',              'IP & Trademark Documents',                         NULL, 'recommended', 'pdf,zip', 10),
  ('funding-agreements',        'Funding Agreements / Term Sheets',                 NULL, 'recommended', 'pdf',     11),
  ('udyam-msme',                'Udyam / MSME Registration',                        NULL, 'recommended', 'pdf',     12),
  ('business-licences',         'Business Licences & Regulatory Approvals',         NULL, 'recommended', 'pdf,zip', 13),
  ('bank-proof',                'Bank Proof / Cancelled Cheque',                    NULL, 'recommended', 'pdf',     14)
ON DUPLICATE KEY UPDATE
  name = VALUES(name), description = VALUES(description), tier = VALUES(tier),
  accepted_types = VALUES(accepted_types), sort_order = VALUES(sort_order);

-- ---------------------------------------------------------------------------
-- 4. Permissions
--
-- Two, matching how the rest of the platform splits "my own" from "everyone's":
-- a founder manages their own startup's vault, staff read every vault for
-- oversight. Staff are never granted upload or replace — the paperwork is the
-- startup's to maintain.
-- ---------------------------------------------------------------------------
INSERT INTO permissions (slug, name, module) VALUES
  ('document.manage_own', 'Upload and replace own startup documents', 'compliance'),
  ('document.view_all',   'View and download any startup documents',  'compliance')
ON DUPLICATE KEY UPDATE name = VALUES(name), module = VALUES(module);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug = 'document.manage_own'
WHERE r.slug = 'founder'
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r JOIN permissions p ON p.slug = 'document.view_all'
WHERE r.slug IN ('forge-manager', 'super-admin', 'backend-manager')
ON DUPLICATE KEY UPDATE role_id = VALUES(role_id);

-- ===========================================================================
-- Verify
--
--   SELECT COUNT(*) FROM document_categories;                        -- 14
--   SELECT tier, COUNT(*) FROM document_categories GROUP BY tier;    -- core 6, recommended 8
--   SELECT COUNT(*) FROM startup_documents;                          -- 0 until the first upload
--   SELECT r.slug, p.slug FROM role_permissions rp
--     JOIN roles r ON r.id = rp.role_id JOIN permissions p ON p.id = rp.permission_id
--    WHERE p.module = 'compliance' ORDER BY r.slug;                  -- 4 rows
-- ===========================================================================
