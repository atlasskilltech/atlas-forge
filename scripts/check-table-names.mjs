/**
 * Static guard: no ATLAS Forge SQL may name a table without the `forge_` prefix.
 *
 *   npm run check:tables
 *
 * Scans, without touching any database:
 *   - every string literal and template-literal text in src/ and scripts/
 *     (JS is parsed, so comments and identifiers are never matched),
 *   - every SQL file in database/ (SQL comments ignored),
 *   - the Python browser suites,
 * for an SQL keyword (FROM, JOIN, INTO, UPDATE, TABLE, EXISTS, REFERENCES,
 * DESCRIBE) or `TABLE_NAME = '...'` followed by one of the 46 legacy names.
 * Exits non-zero on any hit. Run in CI/deploy so an unprefixed reference can
 * never reach production.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { createRequire } from 'node:module'
import { ROOT } from './lib/forge-db.mjs'
import { LOGICAL_TABLES } from '../src/lib/queries/tables.mjs'

const require = createRequire(import.meta.url)
const espree = require('espree')

// Files that intentionally name legacy tables (they map or rename them).
const ALLOW = new Set([
  'src/lib/queries/tables.mjs',
  'scripts/investigate-prefix.mjs',
  'scripts/migrate-forge-prefix.mjs',
  'scripts/check-table-names.mjs',
  'scripts/ops/prod-readonly-report.sh',
])

const alt = [...LOGICAL_TABLES].sort((a, b) => b.length - a.length).join('|')
const kw = `\\b(FROM|JOIN|INTO|UPDATE|TABLE|EXISTS|REFERENCES|DESCRIBE)\\s+\`?(${alt})\`?(?![\\w.])`
const tn = `TABLE_NAME\\s*=\\s*'(${alt})'`
const JS_RE = new RegExp(`${kw}|${tn}`, 'g')
const SQL_RE = new RegExp(`${kw}|${tn}`, 'gi')

const hits = []
const record = (file, text, re, baseLine = 1) => {
  for (const m of text.matchAll(re)) {
    const before = text.slice(0, m.index)
    if (/KEY\s+$/i.test(before.slice(-8)) && /^UPDATE/i.test(m[0])) continue // ON DUPLICATE KEY UPDATE col
    const line = baseLine + (before.match(/\n/g)?.length ?? 0)
    hits.push(`${file}:${line}: ${m[0]}`)
  }
}

function* walk(dir) {
  for (const e of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`
    if (e.isDirectory()) {
      if (!['node_modules', '.next', '__pycache__'].includes(e.name)) yield* walk(rel)
    } else yield rel
  }
}

function scanJs(rel, src) {
  const ast = espree.parse(src, {
    ecmaVersion: 'latest', sourceType: 'module', loc: true, ecmaFeatures: { jsx: true },
  })
  const visit = (node) => {
    if (!node || typeof node.type !== 'string') return
    if (node.type === 'TemplateElement') record(rel, node.value.raw, JS_RE, node.loc.start.line)
    if (node.type === 'Literal' && typeof node.value === 'string') record(rel, node.value, JS_RE, node.loc.start.line)
    for (const [k, v] of Object.entries(node)) {
      if (k === 'loc' || k === 'range') continue
      if (Array.isArray(v)) v.forEach(visit)
      else if (v && typeof v.type === 'string') visit(v)
    }
  }
  visit(ast)
}

let files = 0
for (const dir of ['src', 'scripts', 'database']) {
  for (const rel of walk(dir)) {
    if (ALLOW.has(rel)) continue
    const src = readFileSync(join(ROOT, rel), 'utf8')
    if (/\.(js|mjs|cjs)$/.test(rel)) scanJs(rel, src)
    else if (rel.endsWith('.sql')) record(rel, src.replace(/--[^\n]*/g, (c) => ' '.repeat(c.length)), SQL_RE)
    else if (rel.endsWith('.py')) record(rel, src, JS_RE)
    else continue
    files += 1
  }
}

if (hits.length > 0) {
  console.error(`\nUnprefixed ATLAS Forge table references (${hits.length}):`)
  for (const h of hits) console.error(`  ${relative('.', h)}`)
  console.error('\nUse the central map: import { T } from \'@/lib/queries/tables.mjs\' and write ${T.<name>}.\n')
  process.exit(1)
}
console.log(`check:tables — ${files} files scanned, no unprefixed Forge table references.`)
