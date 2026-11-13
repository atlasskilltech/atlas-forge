#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# ATLAS Forge — production deploy, run ON the EC2 server from the project root
# by .github/workflows/forge.yml after `git pull` (which passes PREV_SHA, the
# commit that was running before the pull).
#
#   PREV_SHA=<sha> bash scripts/deploy.sh
#
# While the OLD app keeps serving:
#   1. preflight: .env complete, clean git tree, static table-name guard,
#      database state (legacy / prefixed / mixed — mixed aborts)
#   2. snapshot the running build (.next -> .next.rollback), npm ci, build
# Maintenance window (Forge only; other applications are never affected):
#   3. stop Forge
#   4. if the database still has legacy table names (one-time, migration 013):
#      verified backup of the 46 tables, content hashes, atomic RENAME to
#      forge_*, re-verified row-by-row against the hashes
#   5. start the new build from ecosystem.config.cjs (node --env-file=.env)
#   6. smoke checks: online, db:check, all 183 statements PREPARE, HTTP pages
# Any failure from step 3 on rolls back automatically: rename reversed (if it
# happened), code reset to PREV_SHA, previous build restored and started.
#
# Never runs schema, seed or reset, never drops or truncates, never edits .env.
# ---------------------------------------------------------------------------
set -uo pipefail

APP=atlas-forge
cd "$(dirname "$0")/.."
ROOT=$(pwd)
BACKUPS="$HOME/forge-migration/backups"
N="node --no-warnings"
MIGRATED_NOW=0
STOPPED=0

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nDEPLOY ABORTED: %s\n' "$*" >&2; exit 1; }

PREV_SHA=${PREV_SHA:-$(git rev-parse -q --verify ORIG_HEAD || true)}
NEW_SHA=$(git rev-parse HEAD)

unset_env_keys() {
  # Remove every setting .env defines from this shell so PM2 cannot capture a
  # stale copy; the ecosystem's filter_env does the same for manual restarts.
  while IFS= read -r key; do unset "$key"; done < <(grep -oE '^[[:space:]]*(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*=' .env | sed -E 's/^[[:space:]]*(export[[:space:]]+)?//; s/=$//')
}

PM2_LOGS="${PM2_HOME:-$HOME/.pm2}/logs"
LOG_SIZES=$(mktemp)

start_app() {
  # PM2 may name the log after the process id (atlas-forge-out-13.log), so
  # remember every candidate's size now and ask PM2 for the real path later.
  for f in "$PM2_LOGS/$APP"-out*.log; do [ -f "$f" ] && echo "$(stat -c %s "$f") $f"; done > "$LOG_SIZES"
  # Subshell: the unset must only affect what PM2 sees, never this script.
  ( unset_env_keys
    pm2 delete "$APP" >/dev/null 2>&1 || true
    pm2 start ecosystem.config.cjs --only "$APP" >/dev/null && pm2 save >/dev/null ) || return 1
  sleep 8
  pm2 jlist | node -e '
    let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
      const p = JSON.parse(s).find((x) => x.name === process.argv[1])
      if (!p) { console.error("   process not found in PM2"); process.exit(1) }
      const e = p.pm2_env
      console.log(`   status=${e.status} restarts=${e.restart_time} node_args=${JSON.stringify(e.node_args)}`)
      const args = [].concat(e.node_args || []).join(" ").split(/\s+/)
      process.exit(e.status === "online" && args.includes("--env-file=.env") ? 0 : 1)
    })' "$APP"
}

# Restores the previous release. Order matters: the rename is reversed while the
# NEW code (which owns the migration tool) is still checked out.
rollback() {
  printf '\n!!! %s — ROLLING BACK to %s\n' "$1" "${PREV_SHA:0:12}" >&2
  pm2 stop "$APP" >/dev/null 2>&1 || true
  if [ "$MIGRATED_NOW" = 1 ]; then
    if $N --env-file=.env scripts/migrate-forge-prefix.mjs --rollback --apply; then
      echo "   database: table names restored to legacy"
    else
      echo "   !!! database rollback FAILED. Tables are still forge_*. Run on the server:" >&2
      echo "       cd $ROOT && git checkout $NEW_SHA -- scripts src/lib/queries/tables.mjs && node --env-file=.env scripts/migrate-forge-prefix.mjs --rollback --apply" >&2
      echo "   Backups: $BACKUPS" >&2
    fi
  fi
  git reset -q --hard "$PREV_SHA" || echo "   !!! git reset to $PREV_SHA failed" >&2
  if ! git diff --quiet "$PREV_SHA" "$NEW_SHA" -- package-lock.json; then npm ci --silent || true; fi
  if [ -d .next.rollback ]; then rm -rf .next && mv .next.rollback .next; fi
  if start_app; then echo "   previous release is running again"; else echo "   !!! previous release failed to start: pm2 logs $APP" >&2; fi
  die "$1 (rolled back)"
}

# --- 1. preflight (old app still serving) -------------------------------------
say "Preflight ($NEW_SHA, previous ${PREV_SHA:-unknown})"
[ -f .env ] || die ".env not found in $ROOT. It is the production configuration source."
[ -n "$PREV_SHA" ] && git cat-file -e "$PREV_SHA^{commit}" 2>/dev/null || die "PREV_SHA unknown: cannot guarantee a rollback."
git diff --quiet HEAD -- || die "tracked files are modified on the server; refusing (rollback needs a clean tree)."
node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=6)?0:1)' \
  || die "Node $(node -v) is too old for --env-file (needs >= 20.6)."

node -e '
  const util = require("node:util")
  const text = require("node:fs").readFileSync(".env", "utf8")
  const env = typeof util.parseEnv === "function" ? util.parseEnv(text) : Object.fromEntries(
    text.split(/\r?\n/).map((l) => l.match(/^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=\s*(.*)$/)).filter(Boolean)
      .map(([, k, v]) => [k, v.trim().replace(/^(["\x27])(.*)\1$/, "$2")]))
  const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME", "SESSION_SECRET", "PORT"]
  const missing = required.filter((k) => !env[k])
  if (!("DB_PASSWORD" in env)) missing.push("DB_PASSWORD")
  console.log(`   .env DB target: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} as ${env.DB_USER} (password ${env.DB_PASSWORD ? "set" : "blank"})`)
  if (missing.length) { console.error(`   .env is missing: ${missing.join(", ")}`); process.exit(1) }
' || die ".env is incomplete."
HTTP_PORT=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).PORT)")

for f in .env.production.local .env.local .env.production; do
  [ -f "$f" ] && echo "   WARNING: $f exists; Next.js also reads it (.env wins for keys it defines)."
done

$N scripts/check-table-names.mjs || die "unprefixed table references in the code."

# npm ci first only if needed to run the DB tools (mysql2 is already present).
PLAN=$($N --env-file=.env scripts/migrate-forge-prefix.mjs 2>&1); rc=$?
STATE=$(printf '%s\n' "$PLAN" | sed -nE 's/^  state +([A-Z]+).*/\1/p')
echo "   database state: ${STATE:-unknown}"
case "$STATE" in
  LEGACY|PREFIXED) ;;
  *) printf '%s\n' "$PLAN"; die "database is not in a clean legacy or prefixed state (exit $rc). Nothing was changed." ;;
esac
if [ "$STATE" = LEGACY ]; then
  bash -c 'docker info >/dev/null 2>&1 || sudo -n docker info >/dev/null 2>&1' || die "docker is needed for the pre-migration backup."
fi

# --- 2. build (old app still serving) -----------------------------------------
say "Install and build"
rm -rf .next.rollback
[ -d .next ] && cp -a .next .next.rollback
if ! { npm ci && npm run build; }; then
  # The old process was never stopped; put its files back and leave it running.
  git reset -q --hard "$PREV_SHA"
  git diff --quiet "$PREV_SHA" "$NEW_SHA" -- package-lock.json || npm ci --silent
  [ -d .next.rollback ] && rm -rf .next && mv .next.rollback .next
  die "build failed; the previous release was never stopped and is unchanged."
fi

# --- 3. maintenance window -----------------------------------------------------
say "Stop $APP (maintenance window starts)"
WINDOW_START=$(date +%s)
pm2 stop "$APP" >/dev/null 2>&1 || true
STOPPED=1

# --- 4. one-time table-prefix migration -----------------------------------------
if [ "$STATE" = LEGACY ]; then
  say "Migration 013: backup, rename to forge_*, verify"
  BACKUP=$(bash scripts/ops/forge-backup.sh "$BACKUPS" "pre-prefix-forge-46" | tee /dev/stderr | tail -1)
  [ -f "$BACKUP" ] || rollback "pre-migration backup failed"
  echo "   backup: $BACKUP"
  PRE_HASHES="${BACKUP%.sql.gz}-hashes.json"

  $N --env-file=.env scripts/migrate-forge-prefix.mjs --apply --report="$BACKUPS/$(date -u +%Y%m%dT%H%M%SZ)-migration-report.json"
  rc=$?
  POST_STATE=$($N --env-file=.env scripts/migrate-forge-prefix.mjs 2>&1 | sed -nE 's/^  state +([A-Z]+).*/\1/p')
  [ "$POST_STATE" = PREFIXED ] && MIGRATED_NOW=1
  [ "$rc" -eq 0 ] || rollback "migration failed or did not verify (exit $rc)"

  POST_HASHES=$(mktemp)
  $N --env-file=.env scripts/ops/table-hashes.mjs --forge --quiet --out="$POST_HASHES" \
    && $N scripts/ops/compare-hashes.mjs "Forge data before vs after rename" "$PRE_HASHES" "$POST_HASHES" \
    || rollback "row-by-row comparison after the rename failed"
  rm -f "$POST_HASHES"
fi

# --- 5. start the new release -----------------------------------------------------
say "Start $APP from ecosystem.config.cjs"
start_app || rollback "new release is not online with --env-file=.env"

# --- 6. smoke checks --------------------------------------------------------------
say "Smoke checks"
$N --env-file=.env scripts/check-db.mjs || rollback "db:check failed"
$N --env-file=.env scripts/verify-queries.mjs | grep -E 'prepared|FAIL' ; [ "${PIPESTATUS[0]}" -eq 0 ] || rollback "application SQL does not compile against the database"
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$HTTP_PORT/login")
echo "   GET /login -> $code"; [ "$code" = 200 ] || rollback "/login returned $code"
code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$HTTP_PORT/api/public/student-activity?applicationId=deploy-smoke-check")
echo "   GET /api/public/student-activity (DB read) -> $code"; [ "$code" -lt 500 ] || rollback "DB-backed API returned $code"
# Only lines written since this start count (log files outlive restarts).
OUT_LOG=$(pm2 jlist | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).find(x=>x.name===process.argv[1]);process.stdout.write(p?.pm2_env?.pm_out_log_path||"")})' "$APP")
OFFSET=$(awk -v f="$OUT_LOG" '$2 == f {print $1}' "$LOG_SIZES"); OFFSET=${OFFSET:-0}
NEW_LINES=$(tail -c +"$((OFFSET + 1))" "$OUT_LOG" 2>/dev/null | grep -a "\[atlas-forge\] database")
printf '%s\n' "$NEW_LINES" | sed 's/^/   /'
printf '%s\n' "$NEW_LINES" | grep -q "database reachable" \
  || rollback "the app did not log a successful database connection since it started ($OUT_LOG)"

say "Deploy complete — maintenance window $(( $(date +%s) - WINDOW_START ))s; previous build kept in .next.rollback"
