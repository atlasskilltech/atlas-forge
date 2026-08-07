// PM2 process definition for ATLAS Forge.
//
// The app is a Next.js server started via `next start`. We point pm2 at the
// Next binary directly (rather than `npm start`) so pm2 supervises the actual
// Node process instead of an npm wrapper it can't cleanly monitor or restart.
module.exports = {
  apps: [
    {
      name: 'atlas-forge',
      cwd: '/home/ubuntu/atlas-forge',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
    },
  ],
}
