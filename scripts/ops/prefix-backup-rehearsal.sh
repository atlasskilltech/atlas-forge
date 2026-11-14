#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Backup + restore verification + full migration rehearsal for the forge_
# table-prefix migration. Run ON the EC2 server by
# .github/workflows/forge-prefix-rehearsal.yml from a throw-away dir ($DIAG).
#
# Production database: READ ONLY. The only statements sent to it are SELECTs
# (inside READ ONLY transactions) and a consistent-snapshot mariadb-dump
# (--single-transaction: no LOCK TABLES, no FLUSH TABLES WITH READ LOCK).
#
# Writes, all outside the app directory:
#   $APP/forge-migration/backups/<ts>-forge-46-tables.sql.gz   (+ .sha256)
#   $APP/forge-migration/backups/<ts>-full-database.sql.gz     (+ .sha256)
#   $APP/forge-migration/backups/<ts>-*.json  (hashes / fingerprints, no row data)
# Uses Docker for the official MariaDB 10.11 client (the server has no MySQL
# tools) and for an ISOLATED restore server: bound to 127.0.0.1 only, random
# credentials, data on tmpfs, removed at the end. The rename rehearsal runs on
# that copy — never on production. Never touches PM2, .env or the app dir.
# ---------------------------------------------------------------------------
set -uo pipefail
: "${DIAG:?}" "${APP:?}" "${RUN_ID:?}"
IMAGE=mariadb:10.11
BK="$APP/forge-migration/backups"
TS=$(date -u +%Y%m%dT%H%M%SZ)
CN="forge-restore-$RUN_ID"
FAILS=0
section() { printf '\n== %s\n' "$*"; }
step() { local label=$1; shift; if "$@"; then echo "  OK    $label"; else echo "  FAIL  $label"; FAILS=$((FAILS+1)); fi; }
die() { echo "  ABORT: $*"; exit 1; }

cd "$APP" || die "$APP missing"
[ -f .env ] || die ".env missing"
for k in $(env | grep -oE '^DB_[A-Z_]*'); do unset "$k"; done
[ -e "$DIAG/node_modules" ] || ln -s "$APP/node_modules" "$DIAG/node_modules"
mkdir -p "$BK" && chmod 700 "$APP/forge-migration" "$BK"
umask 077
N="node --no-warnings"
PROD="$N --env-file=$APP/.env"
DBN=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).DB_NAME)")

section "applications on this server configured for $DBN (directory names only)"
for d in "$HOME"/*/; do
  if grep -qsF "$DBN" "$d".env "$d".env.* "$d"config/*.js "$d"config/*.json "$d"*.config.* 2>/dev/null; then echo "  $(basename "$d")"; fi
done

section "existing backups (sha256 + gzip integrity)"
for f in "$BK"/*.sql.gz; do
  [ -f "$f" ] || continue
  st=OK; (cd "$BK" && sha256sum -c --quiet "$(basename "$f").sha256" >/dev/null 2>&1) || st=SHA-MISMATCH
  gzip -t "$f" 2>/dev/null || st="$st GZIP-BAD"
  printf '  %-6s %10s  %s\n' "$st" "$(stat -c %s "$f")" "$(basename "$f")"
done

section "docker and disk"
DOCKER=docker
if ! docker info >/dev/null 2>&1; then
  if sudo -n docker info >/dev/null 2>&1; then DOCKER="sudo -n docker"; else die "docker not usable by $(whoami) (no group access, no passwordless sudo)"; fi
fi
echo "  docker: $($DOCKER version --format '{{.Server.Version}}' 2>/dev/null) via '$DOCKER'"
AVAIL_KB=$(df -Pk "$HOME" | awk 'NR==2{print $4}')
echo "  free on $HOME: $((AVAIL_KB/1024)) MB"
[ "$AVAIL_KB" -gt 2000000 ] || die "less than 2 GB free"
$DOCKER pull -q "$IMAGE" >/dev/null || die "cannot pull $IMAGE"
echo "  image: $IMAGE ($($DOCKER run --rm "$IMAGE" mariadb-dump --version | sed 's/^.*Distrib/Distrib/'))"

cleanup() { $DOCKER rm -f "$CN" >/dev/null 2>&1; rm -f "$DIAG/my.cnf" "$DIAG"/restore_*.env; }
trap cleanup EXIT

section "production: read-only investigation + content hashes BEFORE the dump"
$PROD "$DIAG/scripts/investigate-prefix.mjs" --json="$BK/$TS-investigation.json" | grep -E 'state|tables in database|total Forge rows|not matching'
$PROD "$DIAG/scripts/ops/table-hashes.mjs" --forge  --out="$BK/$TS-prod-forge-pre.json"
$PROD "$DIAG/scripts/ops/table-hashes.mjs" --others --out="$BK/$TS-prod-others-pre.json"

section "backups (mariadb-dump --single-transaction: consistent, no locks)"
node "$DIAG/scripts/ops/write-mycnf.cjs" .env "$DIAG/my.cnf" || die "cannot write client option file"
LEGACY=$(node -e "import('$DIAG/src/lib/queries/tables.mjs').then(m=>console.log(m.LOGICAL_TABLES.join(' ')))")
DUMP_OPTS="--single-transaction --quick --hex-blob --skip-add-drop-table --no-tablespaces --default-character-set=utf8mb4 --skip-lock-tables"
dump() { # dump <outfile> <extra opts and objects...>
  local out=$1; shift
  $DOCKER run --rm -v "$DIAG/my.cnf:/cfg/my.cnf:ro" "$IMAGE" \
    mariadb-dump --defaults-extra-file=/cfg/my.cnf $DUMP_OPTS "$@" | gzip -9 > "$out"
  local rc=("${PIPESTATUS[@]}")
  [ "${rc[0]}" -eq 0 ] && [ "${rc[1]}" -eq 0 ] && zcat "$out" | tail -1 | grep -q '^-- Dump completed'
}
FORGE_DUMP="$BK/$TS-forge-46-tables.sql.gz"
FULL_DUMP="$BK/$TS-full-database.sql.gz"
step "Forge-only dump (46 tables) completed"  dump "$FORGE_DUMP" "$DBN" $LEGACY
step "full database dump completed"           dump "$FULL_DUMP" --routines --events --triggers "$DBN"
for f in "$FORGE_DUMP" "$FULL_DUMP"; do
  sha256sum "$f" > "$f.sha256"; chmod 600 "$f" "$f.sha256"
  printf '  %s  %8s bytes  sha256 %s\n' "$(basename "$f")" "$(stat -c %s "$f")" "$(cut -c1-64 "$f.sha256")"
done
step "Forge dump contains 46 CREATE TABLE statements" bash -c "[ \$(zcat '$FORGE_DUMP' | grep -c '^CREATE TABLE') -eq 46 ]"
step "dumps contain no DROP TABLE / DROP DATABASE"    bash -c "! zcat '$FORGE_DUMP' '$FULL_DUMP' | grep -qE '^DROP (TABLE|DATABASE)'"

section "production: content hashes AFTER the dump (bounds the dump window)"
$PROD "$DIAG/scripts/ops/table-hashes.mjs" --forge  --out="$BK/$TS-prod-forge-post.json"
$PROD "$DIAG/scripts/ops/table-hashes.mjs" --others --out="$BK/$TS-prod-others-post.json"

section "isolated restore server ($IMAGE, 127.0.0.1 only, tmpfs, random credentials)"
RPW=$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))")
UPW=$(node -e "process.stdout.write(require('crypto').randomBytes(24).toString('hex'))")
$DOCKER run -d --name "$CN" -p 127.0.0.1::3306 --tmpfs /var/lib/mysql:rw,size=3g \
  -e MARIADB_ROOT_PASSWORD="$RPW" "$IMAGE" \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci >/dev/null || die "cannot start restore container"
for i in $(seq 1 60); do $DOCKER exec -e MYSQL_PWD="$RPW" "$CN" mariadb -uroot -e 'SELECT 1' >/dev/null 2>&1 && break; sleep 2; done
PORT=$($DOCKER port "$CN" 3306/tcp | head -1 | sed 's/.*://')
echo "  restore server ready on 127.0.0.1:$PORT ($($DOCKER exec -e MYSQL_PWD="$RPW" "$CN" mariadb -uroot -N -e 'SELECT VERSION()'))"
rsql() { $DOCKER exec -i -e MYSQL_PWD="$RPW" "$CN" mariadb -uroot "$@"; }
rsql -e "CREATE DATABASE restore_full CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
         CREATE DATABASE restore_forge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
         CREATE USER 'rehearsal'@'%' IDENTIFIED BY '$UPW';
         GRANT ALL ON restore_full.* TO 'rehearsal'@'%'; GRANT ALL ON restore_forge.* TO 'rehearsal'@'%';" || die "restore DB setup failed"
for db in restore_full restore_forge; do
  printf 'DB_HOST=127.0.0.1\nDB_PORT=%s\nDB_USER=rehearsal\nDB_PASSWORD=%s\nDB_NAME=%s\n' "$PORT" "$UPW" "$db" > "$DIAG/$db.env"
done
step "full dump restored into restore_full"   bash -c "zcat '$FULL_DUMP'  | $DOCKER exec -i -e MYSQL_PWD='$RPW' '$CN' mariadb -uroot restore_full"
step "Forge dump restored into restore_forge" bash -c "zcat '$FORGE_DUMP' | $DOCKER exec -i -e MYSQL_PWD='$RPW' '$CN' mariadb -uroot restore_forge"

section "restore verification (row count + sha256 of every row, vs production)"
cd "$DIAG"   # no .env here: checks below use only the restore env files
RF="$N --env-file=$DIAG/restore_full.env"; RG="$N --env-file=$DIAG/restore_forge.env"
CMP="$N $DIAG/scripts/ops/compare-hashes.mjs"
$RG "$DIAG/scripts/ops/table-hashes.mjs" --forge  --quiet --out="$BK/$TS-restore-forge-forge.json"
$RF "$DIAG/scripts/ops/table-hashes.mjs" --forge  --quiet --out="$BK/$TS-restore-full-forge.json"
$RF "$DIAG/scripts/ops/table-hashes.mjs" --others --quiet --out="$BK/$TS-restore-full-others.json"
step "Forge-only backup == production (46 tables)"  $CMP "Forge-only backup"            "$BK/$TS-prod-forge-pre.json"  "$BK/$TS-restore-forge-forge.json" "$BK/$TS-prod-forge-post.json"
step "full backup, Forge tables == production"      $CMP "full backup / Forge tables"   "$BK/$TS-prod-forge-pre.json"  "$BK/$TS-restore-full-forge.json"  "$BK/$TS-prod-forge-post.json"
step "full backup, other apps' tables == production" $CMP "full backup / other apps"    "$BK/$TS-prod-others-pre.json" "$BK/$TS-restore-full-others.json" "$BK/$TS-prod-others-post.json"
$RF "$DIAG/scripts/investigate-prefix.mjs" --json="$DIAG/restore-inv.json" > /dev/null
step "restored structure == production (columns/indexes/FKs/constraints of all tables)" node -e '
  const [a,b] = process.argv.slice(1).map((f) => JSON.parse(require("fs").readFileSync(f, "utf8")))
  // Structure only: AUTO_INCREMENT moves with live writes between snapshots,
  // and row content is compared exactly by the hash checks above.
  const fp = (j) => JSON.stringify([j.forge.map((r) => [r.logical, r.fingerprint]), j.otherFingerprints])
  if (fp(a) !== fp(b)) { console.log("    structure differs"); process.exit(1) }' "$BK/$TS-investigation.json" "$DIAG/restore-inv.json"

section "REHEARSAL on the restored copy of the whole shared database (restore_full)"
$RF "$DIAG/scripts/ops/table-hashes.mjs" --forge  --quiet --out="$DIAG/r-forge-0.json"
$RF "$DIAG/scripts/ops/table-hashes.mjs" --others --quiet --out="$DIAG/r-others-0.json"
step "plan (dry run) lists 46 renames, changes nothing" bash -c "$RF '$DIAG/scripts/migrate-forge-prefix.mjs' | grep -cE '^ +[0-9]+  [a-z_]+ +-> forge_' | grep -qx 46"
$RF "$DIAG/scripts/migrate-forge-prefix.mjs" --apply --report="$DIAG/r-apply.json" > "$DIAG/r-apply.out"; rc=$?
grep -E 'state|rows  |RENAME TABLE completed|verified|other tables|FAIL|REFUS' "$DIAG/r-apply.out" | sed 's/^/    /'
step "apply: 46/46 renamed and self-verified" test $rc -eq 0
$RF "$DIAG/scripts/ops/table-hashes.mjs" --forge  --quiet --out="$DIAG/r-forge-1.json"
$RF "$DIAG/scripts/ops/table-hashes.mjs" --others --quiet --out="$DIAG/r-others-1.json"
step "every Forge row identical after rename"        $CMP "Forge data after rename"  "$DIAG/r-forge-0.json"  "$DIAG/r-forge-1.json"
step "other apps' tables identical after rename"     $CMP "other apps after rename"  "$DIAG/r-others-0.json" "$DIAG/r-others-1.json"
step "db:check (new code) passes on migrated copy"   bash -c "$RF '$DIAG/scripts/check-db.mjs' > '$DIAG/r-check.out'"
step "db:verify (new code) passes on migrated copy"  bash -c "$RF '$DIAG/scripts/verify-schema.mjs' > '$DIAG/r-verify.out'"
step "all application SQL prepares on migrated copy" bash -c "$RF '$DIAG/scripts/verify-queries.mjs' | tee '$DIAG/r-queries.out' | grep -E 'prepared|FAIL' | sed 's/^/    /'; grep -q 'All application SQL compiles' '$DIAG/r-queries.out'"
step "second apply is a no-op (idempotent)"          bash -c "$RF '$DIAG/scripts/migrate-forge-prefix.mjs' --apply | grep -q 'Nothing to do'"
$RF "$DIAG/scripts/migrate-forge-prefix.mjs" --rollback --apply > "$DIAG/r-rollback.out"; rc=$?
grep -E 'RENAME TABLE completed|verified' "$DIAG/r-rollback.out" | sed 's/^/    /'
step "rollback: 46/46 back to legacy names, self-verified" test $rc -eq 0
$RF "$DIAG/scripts/ops/table-hashes.mjs" --forge  --quiet --out="$DIAG/r-forge-2.json"
$RF "$DIAG/scripts/ops/table-hashes.mjs" --others --quiet --out="$DIAG/r-others-2.json"
step "every Forge row identical after rollback"      $CMP "Forge data after rollback" "$DIAG/r-forge-0.json"  "$DIAG/r-forge-2.json"
step "other apps' tables identical after rollback"   $CMP "other apps after rollback" "$DIAG/r-others-0.json" "$DIAG/r-others-2.json"
step "re-apply after rollback succeeds"              bash -c "$RF '$DIAG/scripts/migrate-forge-prefix.mjs' --apply | grep -q 'verified    46/46'"

section "production unchanged by this run (state re-read, read-only)"
cd "$APP"
step "production still LEGACY (46/46 unprefixed, no forge_ tables)" bash -c "$PROD '$DIAG/scripts/investigate-prefix.mjs' | grep -q 'state              LEGACY'"

section "summary"
ls -la "$BK" | grep "$TS" | awk '{printf "  %s %10s %s\n", $1, $5, $9}'
echo "  checks failed: $FAILS"
exit $(( FAILS > 0 ))
