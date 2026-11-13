/**
 * PM2 process definition for ATLAS Forge.
 *
 * Why this file exists: PM2 cannot launch a Next.js app by being pointed at
 * the project directory (`pm2 start atlas-forge`). Doing that makes PM2 run
 * `require('/path/to/atlas-forge')`, and because the directory has no `main`
 * entry it dies with:
 *
 *     Error: Cannot find module '/home/ubuntu/atlas-forge'
 *     code: 'MODULE_NOT_FOUND'
 *
 * The production server is started by Next's own CLI (`next start`), exactly
 * as `npm run start` does. This file hands PM2 that binary directly so it owns
 * a single real server process (clean start/stop/reload and signal handling).
 *
 * Config comes from the server's `.env` in the project root. We launch Next
 * through `node --env-file=.env` (see `node_args`) rather than a bare
 * `next start`, because `next start` does NOT read `PORT` from `.env`: it
 * picks its listen port from the real process environment at CLI launch, and
 * its own dotenv loader only runs afterwards (too late for the port). Loading
 * `.env` with `--env-file` puts every value — PORT included — into the
 * environment BEFORE Next boots, so `.env` is the single source of truth.
 * Requires Node >= 20.6 (Next 16 already needs a newer Node, so this is safe).
 *
 * Deploy flow: `bash scripts/deploy.sh` (what the GitHub workflow runs). It
 * builds, then DELETES and re-creates the PM2 process from this file. A plain
 * `pm2 reload atlas-forge` is not enough: it keeps whatever script, node_args
 * and environment the process was first started with, so changes here would
 * never take effect.
 *
 * Use `.cjs` so the file is always evaluated as CommonJS, independent of any
 * future `"type": "module"` in package.json — PM2 config files are CommonJS.
 */
module.exports = {
  apps: [
    {
      name: 'atlas-forge',
      // Next's CLI, not the directory. Relative to `cwd` below.
      script: './node_modules/next/dist/bin/next',
      args: 'start',
      // Run the CLI under Node with the project's `.env` loaded first, so the
      // whole file (PORT, DB_*, SESSION_SECRET, SMTP_*, ...) is in the
      // environment before Next starts. Path is relative to `cwd`.
      interpreter: 'node',
      node_args: '--env-file=.env',
      cwd: __dirname,
      // Next runs its own single HTTP server; cluster mode does not apply.
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      // Guard against a crash loop hammering the box.
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      // Restart if the process balloons past this (tune to the host).
      max_memory_restart: '512M',
      // `.env` must be the ONLY source of the app's settings. Node's
      // `--env-file` never overrides a variable that is already set, so any
      // DB_* (etc.) left in the shell that runs `pm2 start/restart`, or stored
      // in PM2's dump from an earlier start, would silently beat `.env`. Drop
      // every app-owned variable from the inherited shell env so only `.env`
      // can supply them. (Array form: removes variables matching these names.)
      filter_env: [
        'DB_', 'SESSION_', 'SMTP_', 'MAIL_', 'GOOGLE_', 'STUDENT_CHECK_',
        'UPLOAD_', 'AUTH_RATE_LIMIT_', 'NEXT_PUBLIC_', 'LOG_LEVEL', 'PORT',
      ],
      env: {
        // NODE_ENV is forced here (not in `.env`) so production is never left
        // to chance. PM2's env wins over `--env-file`, which is why PORT is
        // deliberately NOT set here — it must come from `.env` (currently
        // 3412, matching the Caddy `reverse_proxy 127.0.0.1:3412` target).
        NODE_ENV: 'production',
      },
    },
  ],
}
