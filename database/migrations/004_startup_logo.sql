-- ===========================================================================
-- 004 · Startup logo uploaded from Founder → Edit Listing
--
--   npm run db:migrate migrations/004_startup_logo.sql
--
-- Edit Listing writes the `startups` row (PUT /api/founder/startup), so the
-- logo belongs on `startups` and nowhere else. `listings` is the jobs/collabs
-- table and has no startup identity of its own — it reaches the logo through
-- `listings.startup_id`, so no column is added there.
--
-- The column holds a site-relative URL ('/uploads/startup-logos/<sha256>.png'),
-- not the image bytes. Blobs in MySQL would travel over the connection on every
-- startup query — `SELECT_STARTUPS` returns whole grids of them — and the file
-- itself is served by a Route Handler that streams it from disk. VARCHAR(255)
-- matches LIMITS.url in src/lib/validate.js.
--
-- NULL means "no logo", which is every existing row: the avatar falls back to
-- the `initial`/`avatar_tone` monogram exactly as it does today. Nothing is
-- renamed, nothing is dropped, and no existing row is rewritten.
--
-- Idempotent on both MySQL 8 and MariaDB: `ADD COLUMN IF NOT EXISTS` is
-- MariaDB-only syntax, so the presence check goes through information_schema
-- and the ALTER is prepared only when the column is genuinely absent.
-- Re-running then executes `SELECT 1` and changes nothing.
-- ===========================================================================

SET @add_logo_url = (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'startups'
         AND COLUMN_NAME  = 'logo_url'
    ),
    'SELECT 1',
    'ALTER TABLE startups ADD COLUMN logo_url VARCHAR(255) NULL DEFAULT NULL AFTER avatar_tone'
  )
);

PREPARE add_logo_url FROM @add_logo_url;
EXECUTE add_logo_url;
DEALLOCATE PREPARE add_logo_url;
