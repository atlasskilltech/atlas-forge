#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# ATLAS Forge — ONLINE schema-migration phase for the deploy (phase 1b).
#
# Sourced by scripts/deploy.sh and called as `run_online_migrations` AFTER
# preflight and BEFORE the build/stop, so Class-A (online-safe, backward-
# compatible) migrations apply while the OLD release keeps serving. Factored
# into its own file so the failure paths can be tested in isolation
# (scripts/__tests__/deploy-phase1b.test.sh) with stubbed commands.
#
# Decoupling: every failure here calls `die` (abort the deploy) — never
# `rollback` and never `migrate.mjs down`. Nothing is built or stopped yet, so
# the old release simply keeps serving and the database is NEVER reversed.
#
# The migration decision comes from `migrate.mjs status --decide`, a stable
# machine-readable token (NONE | APPLY | NO_BASELINE | MAINTENANCE | PROBLEMS),
# NOT from grepping human-readable output.
#
# Overridable for tests (defaults match the real deploy). The *_CMD values are
# command prefixes expanded WITHOUT quoting (word-split on purpose), so a test
# can point them at stub scripts:
#   NODE          node command (default: node --no-warnings)
#   ENV_FILE      env file the runner loads (default: .env)
#   MIGRATE_CMD   how to run migrate.mjs  (default: $NODE --env-file=$ENV_FILE scripts/migrate.mjs)
#   BACKUP_CMD    how to run forge-backup (default: bash scripts/ops/forge-backup.sh)
#   VERIFY_CMD    how to run verify-backup(default: $NODE scripts/ops/verify-backup.mjs)
#   BACKUPS       backup directory (required)
# `die` / `say` are used if the caller defined them, else minimal defaults.
# ---------------------------------------------------------------------------

: "${NODE:=node --no-warnings}"
: "${ENV_FILE:=.env}"
: "${MIGRATE_CMD:=$NODE --env-file=$ENV_FILE scripts/migrate.mjs}"
: "${BACKUP_CMD:=bash scripts/ops/forge-backup.sh}"
: "${VERIFY_CMD:=$NODE scripts/ops/verify-backup.mjs}"

type die >/dev/null 2>&1 || die() { printf '\nDEPLOY ABORTED: %s\n' "$*" >&2; exit 1; }
type say >/dev/null 2>&1 || say() { printf '\n==> %s\n' "$*"; }

run_online_migrations() {
  : "${BACKUPS:?BACKUPS dir required}"
  say "Pending schema migrations (online, old release still serving)"

  # Read-only, machine-readable decision. FORGE_MIGRATE_REMOTE_OK + NODE_ENV let
  # the runner act on this non-local DB; a laptop (neither set) is refused.
  local decision
  # shellcheck disable=SC2086  # *_CMD are intentional command prefixes
  decision=$(FORGE_MIGRATE_REMOTE_OK=1 NODE_ENV=production $MIGRATE_CMD status --decide 2>/dev/null) \
    || die "migration status failed; nothing changed, old release still serving."
  echo "   migration decision: ${decision:-<empty>}"

  case "$decision" in
    NONE)
      return 0 ;;
    NO_BASELINE)
      die "the one-time baseline has not been recorded. Run 'migrate.mjs baseline' (explicit, verified) before applying managed migrations. Nothing changed." ;;
    MAINTENANCE)
      die "pending migration(s) are MAINTENANCE-ONLY (Class-B): NOT applied by an online deploy. Apply them in an approved maintenance window. Nothing changed." ;;
    APPLY)
      : ;;  # fall through to apply
    *)
      die "migration status returned an unexpected decision ('${decision:-empty}'); nothing changed, old release still serving." ;;
  esac

  say "Verified backup before applying pending migrations"
  local backup
  # shellcheck disable=SC2086
  backup=$($BACKUP_CMD "$BACKUPS" "pre-migrate-online" | tee /dev/stderr | tail -1)
  [ -f "$backup" ] || die "pre-migration backup failed; nothing changed, old release still serving."
  # Independent, second verification (no DB, no Docker).
  # shellcheck disable=SC2086
  $VERIFY_CMD "$backup" || die "independent backup verification failed; refusing to migrate. Old release still serving."
  echo "   backup verified: $backup"

  # shellcheck disable=SC2086
  FORGE_MIGRATE_REMOTE_OK=1 NODE_ENV=production $MIGRATE_CMD up --backup="$backup" \
    || die "a pending migration FAILED. No code change was made; the OLD release is still serving and the database was NOT reversed. Resolve and re-run. Backup: $backup"
  echo "   migrations applied; old release still serving the backward-compatible new schema."
}
