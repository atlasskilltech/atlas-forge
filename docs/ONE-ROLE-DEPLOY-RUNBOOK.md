# Runbook — "one user = one role" release (migration 015)

This release changes the role of users in the database and adds a permanent
"delete user" feature. Read it all once before you start. Do the steps **in
this order**. Every command runs **on the EC2 server**, as the `ubuntu` user.

Facts this runbook relies on:

- The app lives in `/home/ubuntu/atlas-forge`, runs in PM2 as `atlas-forge`,
  and reads the database settings from `/home/ubuntu/atlas-forge/.env`.
- **A push/merge to `main` deploys automatically** (`.github/workflows/forge.yml`
  → `git pull` → `scripts/deploy.sh`). `deploy.sh` does **not** run migration
  015. So the migration must be done **before** you merge.
- `deploy.sh` refuses a dirty git tree, so the new scripts are run from a
  separate checkout (a git *worktree*) outside the app folder, not by editing
  files inside `/home/ubuntu/atlas-forge`.
- If the code is deployed without the migration, `deploy.sh`'s SQL smoke test
  (`npm run db:queries`) fails and it rolls back to the previous release by
  itself. That is a safety net, not the plan.

Branch to deploy: `claude/happy-mayer-3te2qp`.

---

## 1. Take a database dump (before anything else)

The migration changes the role of every user and the delete feature cannot be
undone, so take this one backup. It is saved **outside** the app folder.

The server has no MySQL client tools, so the dump runs `mariadb-dump` (the
MariaDB build of `mysqldump`) in a throw-away Docker container. The repo's
existing script does exactly that, only reads the database, never locks other
applications, keeps the password in a mode-600 file that it deletes, and
verifies the result (dump completed, 46 Forge tables, gzip OK, sha256):

```bash
cd /home/ubuntu/atlas-forge
```

```bash
bash scripts/ops/forge-backup.sh /home/ubuntu/forge-db-backups before-one-role
```

The last line it prints is the backup path, for example
`/home/ubuntu/forge-db-backups/20261114T101500Z-before-one-role.sql.gz`.
**Write that path down.** If the script exits with an error, stop here: there
is no usable backup.

(If `docker` needs root on this server, the script already falls back to
`sudo -n docker`.)

Plain `mysqldump` alternative, only if a MySQL client is installed on the
machine you run it from (Forge tables only, because the database is shared):

```bash
cd /home/ubuntu/atlas-forge && node scripts/ops/write-mycnf.cjs .env /home/ubuntu/forge-db-backups/.my.cnf
```

```bash
cd /home/ubuntu/atlas-forge && DBN=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).DB_NAME)") && mysqldump --defaults-extra-file=/home/ubuntu/forge-db-backups/.my.cnf --single-transaction --quick --no-tablespaces --default-character-set=utf8mb4 "$DBN" $(mysql --defaults-extra-file=/home/ubuntu/forge-db-backups/.my.cnf -N -e "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'forge\\_%'" "$DBN") | gzip -9 > /home/ubuntu/forge-db-backups/$(date -u +%Y%m%dT%H%M%SZ)-before-one-role-mysqldump.sql.gz
```

```bash
rm -f /home/ubuntu/forge-db-backups/.my.cnf
```

## 2. Run the dry run and check the list

Get the new code into a separate folder (this does not change the app folder's
files, and `git status` there stays clean):

```bash
cd /home/ubuntu/atlas-forge && git fetch origin claude/happy-mayer-3te2qp && git worktree add /home/ubuntu/forge-015 FETCH_HEAD
```

```bash
ln -s /home/ubuntu/atlas-forge/node_modules /home/ubuntu/forge-015/node_modules
```

Run the READ-ONLY dry run (it opens a read-only transaction and only SELECTs):

```bash
cd /home/ubuntu/forge-015 && node --env-file=/home/ubuntu/atlas-forge/.env scripts/roles-dry-run.mjs | tee /home/ubuntu/forge-db-backups/dry-run-before.txt
```

Check, and only continue if you agree:

- **Users per role — AFTER migration**: the numbers look right.
- **Users whose role would CHANGE** and **Users who would LOSE a real role**:
  read every line. A user who loses Founder keeps their startup row, but can
  no longer open the founder dashboard. A Backend Manager who was also a
  Founder stays Backend Manager only.
- **Users with NO role today**: these become Job Seekers (normally the seeded
  mentor accounts).
- **Staff accounts whose email is NOT @atlasuniversity.edu.in**: the migration
  does not change them and they can still sign in. The Atlas-email rule is
  only checked when a staff account is created or a role is changed. Fix
  their email later if you want them to follow the rule.
- **Pending registrations that would be REFUSED**: after the release these
  cannot be approved (wrong email domain, email already has an account, or
  Application ID already used). Reject them and ask the person to register
  again.

## 3. Run the migration

Stop the app first, so the old code never runs against the new constraint
(the site is down from here until step 4 finishes, a few minutes):

```bash
pm2 stop atlas-forge
```

First migration 014 (links a Google account to a user on first Google
sign-in; it comes with the routing fix and is probably not on production
yet). It only adds two empty columns and an index, and is safe to run again:

```bash
cd /home/ubuntu/forge-015 && node --env-file=/home/ubuntu/atlas-forge/.env scripts/apply-sql.mjs migrations/014_users_google_link.sql
```

Then migration 015:

```bash
cd /home/ubuntu/forge-015 && node --env-file=/home/ubuntu/atlas-forge/.env scripts/apply-sql.mjs migrations/015_one_role_per_user.sql
```

Migration 015 must print `migrations/015_one_role_per_user.sql applied successfully.`
The data part runs in one transaction; if it fails, no role was changed. It
is safe to run again.

Check the result. The dry run must now show no changes and the constraint
present:

```bash
cd /home/ubuntu/forge-015 && node --env-file=/home/ubuntu/atlas-forge/.env scripts/roles-dry-run.mjs | tee /home/ubuntu/forge-db-backups/dry-run-after.txt
```

Expect: `Migration 015 constraint already present: YES`,
`Users whose role would CHANGE: 0`, `network-member role: already removed.`

If the migration failed: do **not** merge. Start the old app again with
`pm2 start atlas-forge`, keep the output, and tell me.

## 4. Deploy the code

Merge the branch into `main` on GitHub (open a pull request from
`claude/happy-mayer-3te2qp` and merge it). The workflow deploys it: it
builds, starts the app and runs its smoke checks. Watch the run in the
GitHub **Actions** tab. Success ends with the app online and all SQL
statements compiling.

If `deploy.sh` fails, it rolls the code back to the previous release by
itself. Then go to **Rollback, case C** below.

Remove the temporary folder afterwards:

```bash
cd /home/ubuntu/atlas-forge && git worktree remove --force /home/ubuntu/forge-015
```

## 5. Smoke test

Use real accounts you own. Do not delete real users during the test.

1. **Job Seeker**: sign in with App ID + password. You go straight to
   `/student/home` (there is no "select role" screen any more).
2. **Founder**: sign in. You go to `/founder/home` and see your startup.
3. **Forge Manager**: sign in → `/forge/dashboard`. Open the approval queue
   and the registrations page.
4. **Backend Manager**: sign in → `/backend/dashboard`.
   - In the sidebar, open **Forge Manager Area** — it must open (this was the
     old bug).
   - **Role Assignments** → search a test account → "Change Role" is shown.
     Try to make a Gmail account a Forge Manager: it must be refused.
   - On the same account, click **Delete User…**: the list of what would be
     removed appears and the button stays disabled until you type the email.
     Click **Cancel**.
   - **Create Staff User** with a Gmail address: it must be refused.
5. **Super Admin**: sign in → `/admin/overview`, read-only.
6. **Google sign-in**: on `/login` click "Continue with Google" with the
   Google account of an existing ATLAS Forge user (same email). You land on
   that user's dashboard. (Not testable before release: there is no Google
   client in the test environment.)
7. **Registration form** `/register`: choose "Atlas Faculty" and enter a Gmail
   address → error on the email field. Choose "Others" with an email that
   already has an account → "already uses this email" error.
8. `pm2 logs atlas-forge --lines 100` shows no new errors.

---

## 6. Rollback plan

Pick the case that matches. The commands below call `docker`; if Docker
needs root on the server, write `sudo docker` instead.

**A. The new code misbehaves, but the roles in the database are fine.**

1. On GitHub, revert the merge (the pull request's **Revert** button, then
   merge that revert PR). It deploys the previous code automatically. The old
   code's SQL still compiles with the new column, so its deploy check passes.
2. Right after that deploy finishes, remove the new constraint so the old
   code can change roles again (it also re-adds the network-member role):

```bash
cd /home/ubuntu/atlas-forge && git fetch origin claude/happy-mayer-3te2qp && git show FETCH_HEAD:database/rollback/015_down_constraint_only.sql > /home/ubuntu/forge-db-backups/015_down.sql
```

```bash
cd /home/ubuntu/atlas-forge && DBN=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).DB_NAME)") && node scripts/ops/write-mycnf.cjs .env /home/ubuntu/forge-db-backups/.my.cnf && docker run --rm -i --network host -v /home/ubuntu/forge-db-backups/.my.cnf:/cfg/my.cnf:ro mariadb:10.11 mariadb --defaults-extra-file=/cfg/my.cnf "$DBN" < /home/ubuntu/forge-db-backups/015_down.sql; rm -f /home/ubuntu/forge-db-backups/.my.cnf
```

   Users keep exactly one role each (the extra roles are not given back).
   Old approved registrations stay Job Seekers.

**B. The roles in the database are wrong, or data was lost.** Restore the
dump from step 1. This puts every Forge table back exactly as it was before
the migration, and **loses everything written since then** (new
registrations, messages, role changes, deletes).

```bash
pm2 stop atlas-forge
```

```bash
cd /home/ubuntu/atlas-forge && DBN=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).DB_NAME)") && node scripts/ops/write-mycnf.cjs .env /home/ubuntu/forge-db-backups/.my.cnf && docker run --rm --network host -v /home/ubuntu/forge-db-backups/.my.cnf:/cfg/my.cnf:ro mariadb:10.11 mariadb --defaults-extra-file=/cfg/my.cnf -N -e "SELECT CONCAT('DROP TABLE \`', TABLE_NAME, '\`;') FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME LIKE 'forge\\_%'" "$DBN" > /home/ubuntu/forge-db-backups/drop-forge-tables.sql && cat /home/ubuntu/forge-db-backups/drop-forge-tables.sql
```

   Check that the list contains **only** `forge_` tables. Then, replacing
   `<BACKUP>` with the path from step 1:

```bash
cd /home/ubuntu/atlas-forge && DBN=$(node -e "process.stdout.write(require('util').parseEnv(require('fs').readFileSync('.env','utf8')).DB_NAME)") && ( echo 'SET FOREIGN_KEY_CHECKS=0;'; cat /home/ubuntu/forge-db-backups/drop-forge-tables.sql; zcat <BACKUP>; echo 'SET FOREIGN_KEY_CHECKS=1;' ) | docker run --rm -i --network host -v /home/ubuntu/forge-db-backups/.my.cnf:/cfg/my.cnf:ro mariadb:10.11 mariadb --defaults-extra-file=/cfg/my.cnf "$DBN"; rm -f /home/ubuntu/forge-db-backups/.my.cnf
```

   Then revert the code on GitHub as in case A step 1. The restored database
   has no 015 constraint, so the down script is not needed. Start the app if
   the deploy did not: `pm2 start atlas-forge`.

**C. The deploy failed and `deploy.sh` rolled the code back by itself.** The
database is migrated but the old code is running. Either fix the problem and
deploy again (the migration does not need to be repeated), or run the
case A step 2 down script so the old code can change roles again.

Note: a user deleted with **Delete User** can only come back by restoring a
dump (case B), with the data loss described there.
