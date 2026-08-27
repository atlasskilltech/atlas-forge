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
cp .env.example .env.local
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

## Environment configuration

Configuration lives entirely in `.env.local` (gitignored) — moving to another
MySQL server should require changing only that file, never application code.
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
[`database/`](database):

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

> ⚠️ `db:schema` / `db:reset` are destructive full rebuilds — use them to
> bootstrap or reset an environment, never to patch a populated database.

Seed sign-in accounts are documented in [`docs/WORKFLOW.md`](docs/WORKFLOW.md#10-seed-accounts).

## Available scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run db:check` | Check database connectivity |
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

---

<sub>ATLAS Forge · Product Development Centre · ATLAS SkillTech University</sub>
