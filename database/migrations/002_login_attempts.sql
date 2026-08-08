-- ===========================================================================
-- 002 · Record authentication attempts so they can be rate limited
--
--   npm run db:migrate migrations/002_login_attempts.sql
--
-- Before this table there was nothing stopping a script from trying passwords
-- against /api/auth/login as fast as the pool would answer. Counting attempts
-- in MySQL rather than in process memory is deliberate:
--
--   * the count survives a restart or a deploy, so a lockout cannot be
--     cleared by waiting for the next release;
--   * it is shared by every worker, so running the app on more than one
--     process does not multiply the allowance by the number of processes.
--
-- There is intentionally NO foreign key to `users`. The whole point is to
-- record attempts against identifiers that do not exist — that is what a
-- credential-stuffing run looks like — and a foreign key would reject exactly
-- the rows worth keeping.
--
-- Idempotent: `CREATE TABLE IF NOT EXISTS` makes re-running a no-op.
-- ===========================================================================

CREATE TABLE IF NOT EXISTS login_attempts (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- The identifier as typed (lowercased), NOT a user id: a failed attempt
  -- against an unknown App ID has no user to point at.
  identifier  VARCHAR(190)    NOT NULL,
  -- 45 characters covers an IPv4-mapped IPv6 address. Empty when the request
  -- arrived without a forwarded-for header rather than NULL, so the index is
  -- usable for every row.
  ip_address  VARCHAR(45)     NOT NULL DEFAULT '',
  -- 'login' or 'password-change'. A VARCHAR rather than an ENUM so adding a
  -- third protected action later is a code change, not a migration.
  action      VARCHAR(32)     NOT NULL DEFAULT 'login',
  succeeded   TINYINT(1)      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- Both lookups are "failures for this key since T", so the key order is
  -- (what we filter on) then (what we range over).
  KEY idx_login_attempts_identifier (action, identifier, created_at),
  KEY idx_login_attempts_ip (action, ip_address, created_at),
  -- Used only by the retention sweep.
  KEY idx_login_attempts_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
