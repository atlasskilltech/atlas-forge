/**
 * Writes a MySQL/MariaDB client option file from a .env, mode 600, so the
 * dump client never receives the password on its command line or in its
 * environment. Prints nothing secret.
 *
 *   node write-mycnf.cjs <path/to/.env> <out/my.cnf>
 */
const fs = require('fs')

const util = require('util')

// Parse exactly as the app does: Node's own .env parser (what --env-file uses).
const text = fs.readFileSync(process.argv[2], 'utf8')
let env = {}
if (typeof util.parseEnv === 'function') env = util.parseEnv(text)
else {
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=\s*(.*)$/)
    if (m) env[m[1]] = m[2].trim().replace(/^(["'])(.*)\1$/, '$2')
  }
}
for (const k of ['DB_HOST', 'DB_USER', 'DB_NAME']) {
  if (!env[k]) { console.error(`missing ${k} in .env`); process.exit(1) }
}
const quote = (v) => `"${String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
const body = [
  '[client]',
  `host=${env.DB_HOST}`,
  `port=${env.DB_PORT || 3306}`,
  `user=${quote(env.DB_USER)}`,
  `password=${quote(env.DB_PASSWORD ?? '')}`,
  '',
].join('\n')
fs.writeFileSync(process.argv[3], body, { mode: 0o600 })
fs.chmodSync(process.argv[3], 0o600)
console.log(`  client option file written (mode 600) for ${env.DB_USER}@${env.DB_HOST}:${env.DB_PORT || 3306}`)
