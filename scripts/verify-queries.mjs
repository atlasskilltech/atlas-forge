/**
 * Query smoke test: asks the server to PREPARE — never execute — every SQL
 * statement the application defines.
 *
 *   node --env-file=.env scripts/verify-queries.mjs
 *
 * Preparing a statement makes MySQL/MariaDB resolve every table and column it
 * names, so this proves that all application SQL compiles against the
 * connected database (e.g. a migrated copy of production) without reading or
 * writing a single row. Covers:
 *   - every exported SQL string in src/lib/queries/*.js
 *   - every exported SQL builder there, called with representative arguments
 *   - every inline SQL template elsewhere in src/ whose only interpolations
 *     are table-map lookups (${T.name}), found by parsing the source
 * Exits non-zero if any statement fails to prepare.
 */
import { register, createRequire } from 'node:module'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import mysql from 'mysql2/promise'
import { dbEnv, describe } from './lib/forge-db.mjs'
import { T } from '../src/lib/queries/tables.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

// Same loader as the module suites: resolve "@/..." and stub Next-only imports.
register(
  'data:text/javascript,' +
    encodeURIComponent(`
  import { statSync } from 'node:fs'
  import { fileURLToPath } from 'node:url'
  const isFile = (u) => { try { return statSync(fileURLToPath(u)).isFile() } catch { return false } }
  const ROOT = ${JSON.stringify(pathToFileURL(ROOT).href)}
  const STUBS = { 'server-only': 'data:text/javascript,' }
  export async function resolve(specifier, context, next) {
    if (STUBS[specifier]) return { url: STUBS[specifier], shortCircuit: true }
    const base = specifier.startsWith('@/') ? new URL('src/' + specifier.slice(2), ROOT + '/').href
      : specifier.startsWith('.') && context.parentURL ? new URL(specifier, context.parentURL).href : null
    if (base) {
      for (const c of [base + '.js', base + '/index.js', base]) if (isFile(c)) return next(c, context)
      return next(base + '.js', context)
    }
    return next(specifier, context)
  }
`),
  pathToFileURL(ROOT + '/')
)

const statements = new Map() // label -> sql
const SQL_START = /^\s*(\(?\s*SELECT|INSERT|UPDATE|DELETE|WITH|REPLACE)\b/i

/* 1. exported constants and builders from the query modules */
const qdir = join(ROOT, 'src/lib/queries')
for (const file of readdirSync(qdir).filter((f) => f.endsWith('.js'))) {
  const mod = await import(pathToFileURL(join(qdir, file)).href)
  for (const [name, value] of Object.entries(mod)) {
    const label = `${file}:${name}`
    if (typeof value === 'string' && SQL_START.test(value)) statements.set(label, value)
    if (typeof value !== 'function') continue
    const calls = {
      selectLookup: () => ['roles', 'industries', 'stages', 'listing_types', 'contract_types', 'mentor_types',
        'mentorship_areas', 'readiness_items', 'document_categories'].map((t) => [t, value(t)]),
      selectSkillsForListings: () => [['(?,?)', value('(?,?)')]],
      selectAreasForMentors: () => [['(?,?)', value('(?,?)')]],
      selectSkillsForMentors: () => [['(?,?)', value('(?,?)')]],
      selectSkillsForUsers: () => [['(?,?)', value('(?,?)')]],
      selectActivityLogs: () => [['all', value({})], ['page', value({ limit: 10, offset: 0 })]],
      selectStartupActivity: () => [['all', value({})], ['page', value({ limit: 10, offset: 0 })]],
      selectErrorLogs: () => [['all', value({})], ['page', value({ limit: 10, offset: 0 })]],
      selectNotifications: () => [['all', value({})], ['page', value({ limit: 10, offset: 0 })]],
      selectMessages: () => [['all', value({})], ['page', value({ limit: 10, offset: 0 })]],
    }[name]
    if (calls) for (const [arg, sql] of calls()) statements.set(`${label}(${arg})`, sql)
  }
}

/* 2. inline SQL templates elsewhere in src/ that interpolate only ${T.x} */
const espree = require('espree')
const walk = (dir) => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(`${dir}/${e.name}`) : /\.(js|mjs)$/.test(e.name) ? [`${dir}/${e.name}`] : [])
for (const rel of walk('src').filter((f) => !f.startsWith('src/lib/queries/'))) {
  const src = readFileSync(join(ROOT, rel), 'utf8')
  if (!src.includes('${T.')) continue
  const ast = espree.parse(src, { ecmaVersion: 'latest', sourceType: 'module', loc: true, ecmaFeatures: { jsx: true } })
  const visit = (n) => {
    if (!n || typeof n.type !== 'string') return
    if (n.type === 'TemplateLiteral' && n.expressions.length > 0 &&
        n.expressions.every((x) => x.type === 'MemberExpression' && x.object.name === 'T' && !x.computed)) {
      const sql = n.quasis.map((qq, i) => qq.value.cooked + (i < n.expressions.length ? T[n.expressions[i].property.name] : '')).join('')
      if (SQL_START.test(sql)) statements.set(`${rel}:${n.loc.start.line}`, sql)
    }
    for (const [k, v] of Object.entries(n)) {
      if (k === 'loc') continue
      if (Array.isArray(v)) v.forEach(visit)
      else if (v && typeof v.type === 'string') visit(v)
    }
  }
  visit(ast)
}

/* 3. prepare each one */
const cfg = dbEnv()
console.log(`\nATLAS Forge — query smoke test (PREPARE only, nothing executed)`)
console.log(`  target  ${describe(cfg)}`)
const conn = await mysql.createConnection(cfg)
const failures = []
for (const [label, sql] of statements) {
  try {
    const stmt = await conn.prepare(sql)
    await stmt.close()
  } catch (error) {
    failures.push(`${label}: ${error.code} ${error.sqlMessage ?? error.message}`)
  }
}
await conn.end()
console.log(`  prepared ${statements.size - failures.length}/${statements.size} statements`)
for (const f of failures) console.log(`  FAIL  ${f}`)
console.log(failures.length ? '\nQuery smoke test FAILED.\n' : '\nAll application SQL compiles against this database.\n')
process.exit(failures.length ? 1 : 0)
