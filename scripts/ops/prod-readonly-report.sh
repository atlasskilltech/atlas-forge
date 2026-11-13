#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# READ-ONLY production report, run ON the EC2 server by
# .github/workflows/forge-db-diagnostic.yml from a throw-away directory ($DIAG).
#
#   DIAG=/tmp/forge-db-diag-<run> APP=/home/ubuntu/atlas-forge bash prod-readonly-report.sh
#
# Never writes to the app directory, .env, PM2 or the database. The only file
# it writes outside $DIAG is the investigation baseline JSON (table names,
# counts and fingerprints — no row data) under ~/forge-migration/.
# All output passes through redact.cjs, which blanks secret values from .env.
# ---------------------------------------------------------------------------
set -uo pipefail
: "${DIAG:?}" "${APP:?}"
cd "$APP" || { echo "FAIL: $APP not found"; exit 1; }
[ -f .env ] || { echo "FAIL: $APP/.env not found"; exit 1; }

# Same as the running app: DB settings come only from .env, not this shell.
for k in $(env | grep -oE '^DB_[A-Z_]*'); do unset "$k"; done
[ -e "$DIAG/node_modules" ] || ln -s "$APP/node_modules" "$DIAG/node_modules"

FORGE_RE='users|roles|permissions|role_permissions|user_roles|sessions|skills|student_profiles|student_skills|industries|stages|startups|startup_members|document_categories|startup_documents|listing_types|contract_types|listings|listing_skills|applications|application_events|approvals|concierge_contacts|posted_needs|mentor_types|mentors|mentor_skills|mentorship_areas|mentor_mentorship_areas|mentorship_requests|mentorship_sessions|readiness_items|incubation_applications|application_readiness|founder_access_grants|contracts|platform_settings|activity_logs|error_logs|notifications|messages|login_attempts|service_requests|partner_requests|outsider_incubation_applications|registration_requests'
DISTINCT_RE='startups|startup_members|startup_documents|incubation_applications|outsider_incubation_applications|founder_access_grants|readiness_items|application_readiness|posted_needs|concierge_contacts|mentorship_requests|mentorship_sessions|mentor_mentorship_areas|registration_requests|student_profiles|listing_skills|application_events|platform_settings'

section() { printf '\n== %s\n' "$*"; }

section "server"
echo "node $(node -v 2>/dev/null || echo MISSING)   pm2 $(pm2 -v 2>/dev/null | tail -1)   $(uname -sr)"
for b in mysqldump mariadb-dump mysql mariadb docker; do printf '  %-13s %s\n' "$b" "$(command -v "$b" || echo '-')"; done
df -h / "$HOME" 2>/dev/null | awk 'NR==1 || !seen[$0]++'

section "PM2 processes (name, status, cwd only)"
pm2 jlist 2>/dev/null | node -e '
  let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
    let l = []; try { l = JSON.parse(s) } catch {}
    for (const p of l) console.log(`  ${String(p.pm2_env.pm_id).padStart(3)} ${p.name.padEnd(28)} ${String(p.pm2_env.status).padEnd(9)} ${p.pm2_env.pm_cwd}`)
  })'

section "other applications' code that names a Forge table (read-only grep)"
OTHER_DIRS=$( { pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{for(const p of JSON.parse(s))console.log(p.pm2_env.pm_cwd)}catch{}})'; ls -d "$HOME"/*/ 2>/dev/null; } \
  | sed 's:/*$::' | sort -u | grep -vx "$APP" | grep -vE '/(forge-migration|forge-backups)$' )
for d in $OTHER_DIRS; do
  [ -d "$d" ] || continue
  hits=$(grep -rIniE --exclude-dir={node_modules,.next,.git,vendor,dist,build,.cache,uploads} \
          --include=*.{js,mjs,cjs,ts,tsx,jsx,php,py,sql} \
          -e "(from|join|into|update|table)[[:space:]]+[\`\"']?($FORGE_RE)\b" \
          -e "['\"\`]($DISTINCT_RE)['\"\`]" "$d" 2>/dev/null | cut -c1-220)
  if [ -n "$hits" ]; then
    echo "  $d: $(printf '%s\n' "$hits" | wc -l) line(s)"; printf '%s\n' "$hits" | head -15 | sed 's/^/    /'
  else
    echo "  $d: none"
  fi
done

section "scheduled jobs (password arguments redacted)"
crontab -l 2>/dev/null | grep -vE '^\s*(#|$)' \
  | sed -E 's/(-p|--password=?|PASS(WORD)?=|MYSQL_PWD=)[^ ]*/\1<redacted>/g' || echo "  no user crontab"
ls /etc/cron.d 2>/dev/null | sed 's/^/  \/etc\/cron.d\//'

section "recent backup-like files (last 14 days; names/sizes only)"
find "$HOME" /var/backups /backup /backups -maxdepth 4 -type f \
  \( -name '*.sql' -o -name '*.sql.gz' -o -name '*.dump' -o -name '*.sql.zst' \) -mtime -14 \
  -printf '  %TY-%Tm-%Td %TH:%TM %12s %p\n' 2>/dev/null | sort -r | head -20
echo "  (end of list)"

section "backup integrity (sha256 + gzip test of every backup in ~/forge-migration/backups)"
BK="$HOME/forge-migration/backups"
if ls "$BK"/*.sql.gz >/dev/null 2>&1; then
  for f in "$BK"/*.sql.gz; do
    ok=OK; (cd "$BK" && sha256sum -c --quiet "$(basename "$f").sha256" >/dev/null 2>&1) || ok=SHA-MISMATCH
    gzip -t "$f" 2>/dev/null || ok="$ok GZIP-BAD"
    printf '  %-6s %10s  %s\n' "$ok" "$(stat -c %s "$f")" "$f"
  done
else
  echo "  no backups found"
fi

section "read-only database check"
node --env-file=.env "$DIAG/scripts/check-db.mjs"
rc_check=$?

section "read-only prefix-migration investigation"
mkdir -p "$HOME/forge-migration" && chmod 700 "$HOME/forge-migration"
BASE="$HOME/forge-migration/investigation-$(date -u +%Y%m%dT%H%M%SZ).json"
node --env-file=.env "$DIAG/scripts/investigate-prefix.mjs" --json="$BASE"
rc_inv=$?
[ -f "$BASE" ] && echo "  baseline sha256 $(sha256sum "$BASE" | cut -c1-64)"

rc_post=0
if node -e "process.exit(require('$BASE').forge.every(r=>r.prefixedExists&&!r.legacyExists)?0:1)" 2>/dev/null; then
  section "POST-MIGRATION verification (read-only)"
  PRE=$(ls -t "$HOME"/forge-migration/backups/*-investigation.json 2>/dev/null | head -1)
  echo "  baseline (pre-migration): $PRE"
  node "$DIAG/scripts/ops/compare-investigations.mjs" "$PRE" "$BASE" || rc_post=1
  node --no-warnings --env-file=.env "$DIAG/scripts/verify-queries.mjs" | grep -E 'prepared|FAIL' | sed 's/^/  /'
  [ "${PIPESTATUS[0]}" -eq 0 ] || rc_post=1
  HP=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).PORT||'')")
  for path in /login "/api/public/student-activity?applicationId=post-migration-check"; do
    code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$HP$path"); echo "  GET $path -> $code"
    [ "$code" -lt 500 ] 2>/dev/null && [ "$code" != 000 ] || rc_post=1
  done
  pm2 jlist 2>/dev/null | node -e '
    let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
      const p=JSON.parse(s).find(x=>x.name==="atlas-forge"); const e=p?.pm2_env||{}
      const a=[].concat(e.node_args||[]).join(" ")
      console.log(`  PM2 atlas-forge: ${e.status} (restarts ${e.restart_time}, unstable ${e.unstable_restarts}, node_args ${a})`)
      process.exit(e.status==="online"&&a.includes("--env-file=.env")?0:1)})' || rc_post=1
  LOGF=$(pm2 jlist 2>/dev/null | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const p=JSON.parse(s).find(x=>x.name==="atlas-forge");process.stdout.write(p?.pm2_env?.pm_out_log_path||"")})')
  echo "  last boot log lines: $(grep -a '\[atlas-forge\] database' "$LOGF" 2>/dev/null | tail -1)"
  ERRF=${LOGF/-out/-error}
  echo "  missing-table errors in app error log since deploy: $(grep -acE "ER_NO_SUCH_TABLE|doesn't exist" "$ERRF" 2>/dev/null || true)"
fi

exit $(( rc_check != 0 || rc_inv != 0 || rc_post != 0 ))
