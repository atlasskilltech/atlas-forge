# ATLAS Forge

**The Product Development Centre for [ATLAS SkillTech University](https://atlasuniversity.edu.in).**

ATLAS Forge is a private, invite-only platform that connects students who want
real work with student founders who need help building their startups — while
university staff keep control of quality, access, and oversight.

It is not open to the public. There is no sign-up. Every user is issued an
**App ID** by the university and signs in with that.

> In one sentence: ATLAS Forge connects students who want work with founders who
> need help, while the university keeps control of quality and access.

---

## Table of contents

- [What it does](#what-it-does)
- [Roles](#roles)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment configuration](#environment-configuration)
- [Database](#database)
- [Available scripts](#available-scripts)
- [Testing](#testing)
- [Project structure](#project-structure)
- [Further documentation](#further-documentation)

---

## What it does.

A university repeatedly hits the same three problems. ATLAS Forge solves each:

| The problem | How ATLAS Forge solves it |
|---|---|
| A founder needs a designer but doesn't know which student can design | The founder searches the **Student Pool** and contacts them |
| A student wants real project experience but doesn't know who is hiring | The student browses **Jobs** and **Projects** and applies |
| Staff have no visibility across all the startups | Every action is recorded and shown in **logs and reports** |

## Roles

The platform serves five roles, each with its own screens, navigation, and
permissions:

| Role | What they do |
|---|---|
| **Standard Student** | Browse jobs, projects, and mentorship; flag availability; apply to work |
| **Founder (Startup)** | Manage their startup, post jobs, review applicants, and contact students |
| **Forge Manager** | Oversee the incubator, approve content, and assign mentors |
| **Backend Manager** | Platform settings, user roles, and full override access |
| **Super Admin** | Read-only visibility across the entire platform |

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router) with **React 19**
- **Tailwind CSS 4** (via `@tailwindcss/postcss`)
- **MySQL 8 / MariaDB 10.4+** through `mysql2`
- App-ID-based authentication with signed, HTTP-only session cookies
- **ESLint 9** with `eslint-config-next`
- JavaScript (JSConfig, no TypeScript build step)

> **Note:** This project pins a specific build of Next.js whose conventions may
> differ from upstream releases. See [`AGENTS.md`](AGENTS.md) and the bundled
> guides in `node_modules/next/dist/docs/` before making framework-level changes.

## Getting started

### Prerequisites

- **Node.js** (a current LTS with support for `--env-file`, i.e. Node 20+)
- A reachable **MySQL 8 / MariaDB 10.4+** server

### Install and run

```bash
# 1. Install dependencies
npm install

# 2. Create your local environment file
cp .env.example .env
#    then fill in SESSION_SECRET and the DB_* values (see below)

# 3. Bootstrap the database (schema + reference data + seed accounts)
npm run db:reset

# 4. Start the dev server
npm run dev
```

The app runs at **http://localhost:3000**.

For production:

```bash
npm run build
npm run start
```

### Running under PM2

Do **not** start PM2 by pointing it at the project folder
(`pm2 start atlas-forge`) — PM2 would try to `require()` the directory and die
with `Error: Cannot find module '.../atlas-forge'` (`MODULE_NOT_FOUND`). A
Next.js app has to be launched through `next start`, which is what the bundled
[`ecosystem.config.cjs`](ecosystem.config.cjs) does:

```bash
bash scripts/deploy.sh   # what the GitHub workflow runs after `git pull`
```

`scripts/deploy.sh` checks `.env`, runs `npm ci` and `npm run build`, then
**deletes and re-creates** the PM2 process from `ecosystem.config.cjs` and runs
the read-only `npm run db:check`. Do not use `pm2 reload atlas-forge` to pick up
configuration changes: a reload keeps the script, `node_args` and environment
the process was first started with.

On start the app logs the database it resolved (never the password) and
whether it could reach it:

```bash
pm2 logs atlas-forge --lines 50 --nostream | grep "\[atlas-forge\] database"
```

Under PM2 the app's configuration — including `PORT` — comes from the
server's `.env` in the project root. The ecosystem file launches Next via
`node --env-file=.env`, because a bare `next start` does **not** read `PORT`
from `.env` (it fixes its listen port from the real environment before its own
dotenv loader runs). Set `PORT=3412` in `.env`; a Caddy reverse proxy
terminates TLS and forwards `atlasforge.in` to `127.0.0.1:3412`. Keep the
`PORT` in `.env` and the `reverse_proxy` target in the Caddyfile in sync.
(`npm run dev` still uses the Next default of `3000`.)

```caddy
# /etc/caddy/Caddyfile
atlasforge.in, www.atlasforge.in {
    reverse_proxy 127.0.0.1:3412
}
```

## Environment configuration

Configuration lives entirely in the project's **`.env`** (gitignored). It is
the single source of truth: PM2 starts the app with `node --env-file=.env`, and
every `npm run db:*` / `test:*` script loads the same file. Moving to another
MySQL server should require changing only `.env`, never application code.

Do not put settings in `.env.local`, `.env.production` or
`.env.production.local`. Next.js also reads those; values in `.env` win, but a
key `.env` lacks would be taken from them. `npm run db:check` fails if one of
them supplies a `DB_*` value `.env` does not define.
Copy [`.env.example`](.env.example) and fill in the values. Key settings:

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | **Required.** Signs the session cookie; the app refuses to start without it. Generate one per environment (see below). |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | MySQL connection details |
| `DB_SSL` / `DB_SSL_CA` | Enable TLS for managed MySQL providers |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for canonical URLs, sitemap, and OG tags |
| `AUTH_RATE_LIMIT_*` | Failed-sign-in rate limiting, counted per App ID and per client address |

Generate a `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

See [`.env.example`](.env.example) for the full, documented list.

## Database

The schema targets **MySQL 8 / MariaDB 10.4+** (InnoDB, `utf8mb4`). SQL lives in
[`database/`](database).

### Table names: the `forge_` prefix

Production shares one database with Research Portal (`research_*`), Atlas News
(`atlasnews_*`) and Employment Survey, so **every ATLAS Forge table is named
`forge_<name>`** (46 tables). The physical names are defined in exactly one
place, [`src/lib/queries/tables.mjs`](src/lib/queries/tables.mjs); all SQL uses
the map:

```js
import { T } from '@/lib/queries/tables.mjs'
const SQL = `SELECT ... FROM ${T.users} u JOIN ${T.user_roles} ur ON ...`
```

`npm run check:tables` fails on any unprefixed table reference, and the deploy
runs it. Databases created before the prefix are converted once by migration
013 (`npm run db:prefix` — plan by default, `-- --apply`, `-- --rollback
--apply`): one atomic `RENAME TABLE` of all 46 tables, verified before and
after; `scripts/deploy.sh` runs it automatically, with a verified backup, the
first time it meets a legacy database. Until then the SQL scripts refuse to run.

Files:

- `schema.sql` — full schema (a **destructive** rebuild; drops and recreates tables)
- `reference-data.sql` — reference/lookup data
- `seed.sql` — seed accounts and sample data
- `migrations/` — incremental, additive changes

Common flows:

```bash
npm run db:check      # verify connectivity and configuration
npm run db:reset      # rebuild schema, then load reference data + seed
npm run db:migrate    # apply a migration file from database/migrations/
npm run db:verify     # verify the live schema matches expectations
```

> ⚠️ `db:schema` / `db:reset` are destructive full rebuilds for a dedicated
> development database. Production shares its MySQL database with other
> applications (Atlas News, Research Portal), so the scripts enforce:
>
> - SQL only ever runs against `DB_NAME`; a file containing `USE` or
>   `CREATE/ALTER/DROP DATABASE` is refused.
> - `db:schema` (and so `db:reset`) refuses — even with `--force` — when the
>   database holds any table that is not ATLAS Forge's.
> - `db:seed` (demo accounts) is refused on such a shared database.
> - Every write is refused if a table with a Forge name exists but is not
>   Forge's (for example another application's `users` table).
>
> Production changes go through `npm run db:migrate -- migrations/<file>.sql`.

Seed sign-in accounts are documented in [`docs/WORKFLOW.md`](docs/WORKFLOW.md#10-seed-accounts).

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:check` | Read-only check: connection, Forge tables present, env-file conflicts |
| `npm run check:tables` | Static guard: no unprefixed Forge table names in code or SQL |
| `npm run db:investigate` | Read-only report: table layout, row counts, fingerprints, other apps' tables |
| `npm run db:prefix` | Migration 013 (`forge_` prefix): plan, `-- --apply`, `-- --rollback --apply` |
| `npm run db:queries` | PREPAREs every application SQL statement (executes nothing) |
| `npm run db:reset` | Rebuild schema + reference data + seed |
| `npm run db:migrate` | Apply a migration |
| `npm run db:verify` | Verify the live schema |
| `npm run db:test` | Verify the data layer |
| `npm run test:*` | Per-module verification suites (see below) |

## Testing

Verification suites live in [`scripts/`](scripts) and run against a live app and
database. Each of the five feature areas has module, API, and browser suites:

```bash
npm run test:student          # student module
npm run test:student:api      # student API layer
npm run test:student:browser  # student end-to-end (Python)

# ...and likewise for :founder, :forge, :backend, :admin
```

Cross-cutting suites:

```bash
npm run test:security     # authentication and access-control checks
npm run test:errors       # error-handling behaviour
npm run test:pagination   # list pagination
```

> Browser suites (`*:browser`) are Python scripts and drive a real browser.
> The auth rate limiter can be disabled for test runs by setting the
> `AUTH_RATE_LIMIT_*` maximums to `0` in your environment.

## Project structure

```
atlas-forge/
├── src/
│   ├── app/            # Next.js App Router — one folder per role + /api routes
│   │   ├── student/    # Student screens
│   │   ├── founder/    # Founder screens
│   │   ├── forge/      # Forge Manager screens
│   │   ├── backend/    # Backend Manager screens
│   │   ├── admin/      # Super Admin (read-only) screens
│   │   └── api/        # Route handlers (auth, per-role data)
│   ├── components/     # UI, shared, and per-role components
│   ├── config/         # roles, navigation, and site identity
│   ├── hooks/          # React hooks
│   └── lib/            # db, auth, queries, repositories, services, utils
├── database/           # schema, reference data, seed, migrations
├── scripts/            # DB tooling and verification suites
├── docs/               # WORKFLOW.md (full platform guide) + accessibility notes
├── reference/          # Design references (Figma exports)
└── public/             # Static assets
```

## Further documentation

- **[`docs/WORKFLOW.md`](docs/WORKFLOW.md)** — the complete platform guide: user
  journeys, a screen-by-screen walkthrough, the permissions table, the approval
  workflow, seed accounts, and a full end-to-end testing guide. Written for
  testers and newcomers, with no code required.
- **[`docs/accessibility.md`](docs/accessibility.md)** — accessibility notes.
- **[`AGENTS.md`](AGENTS.md)** — notes for AI coding agents working in this repo.

----

<sub>ATLAS Forge · Product Development Centre · ATLAS SkillTech University</sub>
