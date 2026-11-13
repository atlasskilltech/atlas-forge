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

section "read-only database check"
node --env-file=.env "$DIAG/scripts/check-db.mjs"
rc_check=$?

section "read-only prefix-migration investigation"
mkdir -p "$HOME/forge-migration" && chmod 700 "$HOME/forge-migration"
BASE="$HOME/forge-migration/investigation-$(date -u +%Y%m%dT%H%M%SZ).json"
node --env-file=.env "$DIAG/scripts/investigate-prefix.mjs" --json="$BASE"
rc_inv=$?
[ -f "$BASE" ] && echo "  baseline sha256 $(sha256sum "$BASE" | cut -c1-64)"

exit $(( rc_check != 0 || rc_inv != 0 ))
