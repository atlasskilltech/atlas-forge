#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# ATLAS Forge — production deploy, run ON the EC2 server from the project root
# (the GitHub workflow runs it after `git pull`).
#
#   bash scripts/deploy.sh
#
# 1. Preflight: `.env` exists and defines every required setting. Nothing is
#    printed from it except the DB target (never the password). If this fails,
#    the currently running process is left exactly as it is.
# 2. npm ci + next build. A failed build also leaves the running process alone.
# 3. Re-creates the PM2 process from ecosystem.config.cjs, so it always runs
#    `node --env-file=.env next start` with a clean environment.
# 4. Read-only `npm run db:check` against the live database. The deploy (and
#    the workflow) fails if the app cannot read its tables.
#
# Never runs schema, seed, reset or migrations, and never edits `.env`.
# ---------------------------------------------------------------------------
set -euo pipefail

APP=atlas-forge
cd "$(dirname "$0")/.."

say() { printf '\n==> %s\n' "$*"; }
die() { printf '\nDEPLOY ABORTED: %s\n' "$*" >&2; exit 1; }

# --- 1. preflight -----------------------------------------------------------
say "Preflight"
[ -f .env ] || die ".env not found in $(pwd). It is the production configuration source."

node -e 'const [a,b]=process.versions.node.split(".").map(Number); process.exit(a>20||(a===20&&b>=6)?0:1)' \
  || die "Node $(node -v) is too old for --env-file (needs >= 20.6)."

# Parse .env with Node's own parser (the same one --env-file uses), print the
# DB target without the password, and fail on missing required keys.
node -e '
  const util = require("node:util")
  const text = require("node:fs").readFileSync(".env", "utf8")
  const env = typeof util.parseEnv === "function" ? util.parseEnv(text) : Object.fromEntries(
    text.split(/\r?\n/).map((l) => l.match(/^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=\s*(.*)$/)).filter(Boolean)
      .map(([, k, v]) => [k, v.trim().replace(/^(["\x27])(.*)\1$/, "$2")]))
  const required = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME", "SESSION_SECRET"]
  const missing = required.filter((k) => !env[k])
  if (!("DB_PASSWORD" in env)) missing.push("DB_PASSWORD")
  console.log(`   .env DB target: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME} as ${env.DB_USER} (password ${env.DB_PASSWORD ? "set" : "blank"})`)
  if (missing.length) { console.error(`   .env is missing: ${missing.join(", ")}`); process.exit(1) }
' || die ".env is incomplete."

for f in .env.production.local .env.local .env.production; do
  if [ -f "$f" ]; then
    echo "   WARNING: $f exists. Next.js also reads it; .env values win, but any key"
    echo "            .env lacks would be taken from $f. db:check reports DB_* conflicts."
  fi
done

# --- 2. build -----------------------------------------------------------------
say "Install and build"
npm ci
npm run build

# --- 3. (re)start under PM2 ---------------------------------------------------
say "Restart $APP under PM2 from ecosystem.config.cjs"
# Remove any app setting exported in this shell so PM2 cannot capture it; the
# ecosystem's filter_env does the same for later manual restarts.
while IFS= read -r key; do unset "$key"; done < <(grep -oE '^[[:space:]]*(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*=' .env | sed -E 's/^[[:space:]]*(export[[:space:]]+)?//; s/=$//')

# delete + start (not reload): reload keeps the original script, node_args and
# environment, which is how a process can keep running without --env-file=.env.
pm2 delete "$APP" >/dev/null 2>&1 || true
pm2 start ecosystem.config.cjs --only "$APP"
pm2 save

sleep 8
pm2 jlist | node -e '
  let s = ""; process.stdin.on("data", (d) => (s += d)).on("end", () => {
    const p = JSON.parse(s).find((x) => x.name === process.argv[1])
    if (!p) { console.error("   process not found in PM2"); process.exit(1) }
    const e = p.pm2_env
    console.log(`   status=${e.status} restarts=${e.restart_time} node_args=${JSON.stringify(e.node_args)} script=${e.pm_exec_path}`)
    const args = [].concat(e.node_args || []).join(" ").split(/\s+/)
    const ok = e.status === "online" && args.includes("--env-file=.env")
    process.exit(ok ? 0 : 1)
  })' "$APP" || die "$APP is not online with --env-file=.env. Check: pm2 logs $APP --err --lines 100"

# --- 4. read-only DB verification -------------------------------------------
say "Read-only database check (same .env as the running app)"
npm run --silent db:check || die "the app is running but cannot use its database (see above)."

say "Deploy complete"
