#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# T1 — shell-level tests for the deploy online-migration phase (phase 1b),
# scripts/lib/deploy-online-migrations.sh, in ISOLATION with stubbed commands.
#
#   bash scripts/__tests__/deploy-phase1b.test.sh
#
# Proves, for every failure path, that: the phase aborts (non-zero) without ever
# calling pm2 (the app is never stopped), without ever calling a `down`/rollback,
# and only calls `up` after a successful status→backup→verify sequence.
# No database, no Docker, no network.
# ---------------------------------------------------------------------------
set -u
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
LIB="$ROOT/scripts/lib/deploy-online-migrations.sh"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT
STUB="$WORK/stub"; mkdir -p "$STUB"
export BACKUPS="$WORK/backups"; mkdir -p "$BACKUPS"
export CALLS="$WORK/calls.log"
export PM2_MARKER="$WORK/pm2-was-called"

# ---- stubs ----------------------------------------------------------------
cat > "$STUB/migrate.sh" <<'EOF'
#!/usr/bin/env bash
echo "migrate $*" >> "$CALLS"
case "$1" in
  status) [ "${SCENARIO_STATUS:-ok}" = fail ] && exit 1; echo "${SCENARIO_DECISION:-NONE}"; exit 0 ;;
  up)     [ "${SCENARIO_UP:-ok}" = fail ] && exit 1; exit 0 ;;
  *)      exit 0 ;;
esac
EOF
cat > "$STUB/backup.sh" <<'EOF'
#!/usr/bin/env bash
if [ "${SCENARIO_BACKUP:-ok}" = fail ]; then echo "backup: error"; exit 1; fi
f="$1/stub-backup.sql.gz"; : > "$f"; echo "backup: made"; echo "$f"
EOF
cat > "$STUB/verify.sh" <<'EOF'
#!/usr/bin/env bash
[ "${SCENARIO_VERIFY:-ok}" = fail ] && exit 1
exit 0
EOF
cat > "$STUB/pm2" <<'EOF'
#!/usr/bin/env bash
echo "pm2 $*" >> "$PM2_MARKER"
EOF
chmod +x "$STUB"/*.sh "$STUB/pm2"

export PATH="$STUB:$PATH"
export MIGRATE_CMD="bash $STUB/migrate.sh"
export BACKUP_CMD="bash $STUB/backup.sh"
export VERIFY_CMD="bash $STUB/verify.sh"

FAILS=0
ok()   { printf '  ok   %s\n' "$1"; }
bad()  { printf '  FAIL %s\n' "$1"; FAILS=$((FAILS+1)); }

# run_case <name> <expect_rc> <expect_up: yes|no> ENV=VAL...
run_case() {
  local name="$1" expect_rc="$2" expect_up="$3"; shift 3
  : > "$CALLS"; rm -f "$PM2_MARKER"
  ( set +e
    for kv in "$@"; do export "$kv"; done
    . "$LIB"
    run_online_migrations
  ) >/dev/null 2>&1
  local rc=$?

  if { [ "$expect_rc" = 0 ] && [ "$rc" -eq 0 ]; } || { [ "$expect_rc" != 0 ] && [ "$rc" -ne 0 ]; }; then
    ok "$name: exit code ($rc)"
  else bad "$name: expected rc $expect_rc, got $rc"; fi

  [ ! -f "$PM2_MARKER" ] && ok "$name: pm2 never called" || bad "$name: pm2 WAS called (app would be stopped)"

  if grep -qiw down "$CALLS" 2>/dev/null; then bad "$name: a 'down' migration was called"; else ok "$name: no down/rollback"; fi

  if [ "$expect_up" = yes ]; then
    grep -q '^migrate up' "$CALLS" && ok "$name: up was called" || bad "$name: up should have run"
  else
    grep -q '^migrate up' "$CALLS" && bad "$name: up ran but should NOT have" || ok "$name: up not called"
  fi
}

echo "== phase 1b failure-path tests =="
run_case "status fails"        1 no  SCENARIO_STATUS=fail
run_case "decision NONE"       0 no  SCENARIO_DECISION=NONE
run_case "NO_BASELINE aborts"  1 no  SCENARIO_DECISION=NO_BASELINE
run_case "MAINTENANCE aborts"  1 no  SCENARIO_DECISION=MAINTENANCE
run_case "backup fails"        1 no  SCENARIO_DECISION=APPLY SCENARIO_BACKUP=fail
run_case "verify fails"        1 no  SCENARIO_DECISION=APPLY SCENARIO_VERIFY=fail
run_case "migration up fails"  1 yes SCENARIO_DECISION=APPLY SCENARIO_UP=fail
run_case "apply succeeds"      0 yes SCENARIO_DECISION=APPLY

echo "== structural guarantees =="
# Check only executable (non-comment) lines — the comments intentionally mention
# rollback/down to document that the code never calls them.
if grep -vE '^[[:space:]]*#' "$LIB" | grep -qiE 'rollback|\bdown\b'; then bad "lib references rollback/down in code"; else ok "lib code contains no rollback/down"; fi

echo
if [ "$FAILS" -eq 0 ]; then echo "ALL PHASE-1B TESTS PASSED"; exit 0; else echo "$FAILS CHECK(S) FAILED"; exit 1; fi
