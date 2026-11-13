#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Verified backup of ATLAS Forge's 46 tables (whatever their current names),
# taken by scripts/deploy.sh right before the prefix migration, while Forge is
# stopped. Production is only READ (mariadb-dump --single-transaction: no
# table or global locks, other applications are not blocked).
#
#   bash scripts/ops/forge-backup.sh <backup-dir> <label>
#
# Writes <dir>/<ts>-<label>.sql.gz (+ .sha256 and a content-hash JSON) mode
# 600 and verifies: dump completed, 46 CREATE TABLE statements, no DROP
# statements, gzip integrity. Uses the official MariaDB 10.11 client in a
# throw-away container (the server has no MySQL tools); the password reaches
# it only through a mode-600 option file that is deleted afterwards.
# Prints the backup path on the last line. Exit non-zero = no usable backup.
# ---------------------------------------------------------------------------
set -uo pipefail
DIR=${1:?backup dir}; LABEL=${2:?label}
IMAGE=mariadb:10.11
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
cd "$ROOT" || exit 1
umask 077; mkdir -p "$DIR"; chmod 700 "$DIR"
TS=$(date -u +%Y%m%dT%H%M%SZ)
OUT="$DIR/$TS-$LABEL.sql.gz"
CNF=$(mktemp); trap 'rm -f "$CNF"' EXIT

DOCKER=docker
docker info >/dev/null 2>&1 || { sudo -n docker info >/dev/null 2>&1 && DOCKER="sudo -n docker"; } || { echo "backup: docker not usable"; exit 1; }
$DOCKER image inspect "$IMAGE" >/dev/null 2>&1 || $DOCKER pull -q "$IMAGE" >/dev/null || { echo "backup: cannot pull $IMAGE"; exit 1; }

node scripts/ops/write-mycnf.cjs .env "$CNF" >/dev/null || { echo "backup: cannot read .env"; exit 1; }
DBN=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).DB_NAME)")
# The 46 tables under whichever names they currently have.
TABLES=$(node --no-warnings --env-file=.env -e "
  import('./src/lib/queries/tables.mjs').then(async ({ LOGICAL_TABLES, TABLE_RENAMES }) => {
    const mysql = (await import('mysql2/promise')).default
    const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env
    const c = await mysql.createConnection({ host: DB_HOST, port: +(DB_PORT || 3306), user: DB_USER, password: DB_PASSWORD, database: DB_NAME })
    const [rows] = await c.query('SELECT TABLE_NAME n FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')
    const have = new Set(rows.map((r) => r.n)); await c.end()
    const list = LOGICAL_TABLES.map((l) => have.has(TABLE_RENAMES[l]) ? TABLE_RENAMES[l] : have.has(l) ? l : null)
    if (list.includes(null)) { console.error('backup: a Forge table is missing'); process.exit(1) }
    console.log(list.join(' '))
  })") || exit 1

$DOCKER run --rm -v "$CNF:/cfg/my.cnf:ro" "$IMAGE" mariadb-dump --defaults-extra-file=/cfg/my.cnf \
  --single-transaction --quick --hex-blob --skip-add-drop-table --no-tablespaces \
  --default-character-set=utf8mb4 --skip-lock-tables "$DBN" $TABLES | gzip -9 > "$OUT"
rc=("${PIPESTATUS[@]}")
[ "${rc[0]}" -eq 0 ] && [ "${rc[1]}" -eq 0 ] || { echo "backup: mariadb-dump failed (${rc[*]})"; exit 1; }
gzip -t "$OUT" || { echo "backup: gzip integrity check failed"; exit 1; }
zcat "$OUT" | tail -1 | grep -q '^-- Dump completed' || { echo "backup: dump incomplete"; exit 1; }
[ "$(zcat "$OUT" | grep -c '^CREATE TABLE')" -eq 46 ] || { echo "backup: expected 46 CREATE TABLE"; exit 1; }
! zcat "$OUT" | grep -qE '^DROP (TABLE|DATABASE)' || { echo "backup: unexpected DROP statement"; exit 1; }
sha256sum "$OUT" > "$OUT.sha256"
node --no-warnings --env-file=.env scripts/ops/table-hashes.mjs --forge --quiet --out="${OUT%.sql.gz}-hashes.json" || exit 1
chmod 600 "$OUT" "$OUT.sha256" "${OUT%.sql.gz}-hashes.json"
echo "backup: verified $(stat -c %s "$OUT") bytes, sha256 $(cut -c1-16 "$OUT.sha256")…"
echo "$OUT"
