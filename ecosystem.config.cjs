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
 * Deploy flow (run from the project root):
 *     npm ci
 *     npm run build
 *     pm2 start ecosystem.config.cjs
 *     pm2 save            # persist across reboots (with `pm2 startup`)
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
      env: {
        NODE_ENV: 'production',
        // `next start` defaults to 3000; override here or in the shell env.
        PORT: 3000,
      },
    },
  ],
}
