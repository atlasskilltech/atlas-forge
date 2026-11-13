/**
 * Output filter for production runs: copies stdin to stdout, replacing the
 * VALUE of every secret-looking key in the given .env file (PASS, SECRET, KEY,
 * TOKEN, CA) with <redacted>, so a credential can never reach a CI log even if
 * some tool echoes it.
 *
 *   some-command 2>&1 | node redact.cjs /path/to/.env
 */
const fs = require('fs')

const secrets = []
try {
  for (const line of fs.readFileSync(process.argv[2], 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Za-z_]\w*)\s*=\s*(.*)$/)
    if (!m || !/(PASS|SECRET|KEY|TOKEN|_CA$)/i.test(m[1])) continue
    const v = m[2].trim().replace(/^(["'])(.*)\1$/, '$2')
    if (v.length >= 4) secrets.push(v)
  }
} catch {
  // No readable .env: nothing to redact.
}
secrets.sort((a, b) => b.length - a.length)

let buf = ''
const out = (s) => {
  for (const v of secrets) s = s.split(v).join('<redacted>')
  process.stdout.write(s)
}
process.stdin
  .on('data', (d) => {
    buf += d
    const i = buf.lastIndexOf('\n')
    if (i >= 0) {
      out(buf.slice(0, i + 1))
      buf = buf.slice(i + 1)
    }
  })
  .on('end', () => out(buf))
