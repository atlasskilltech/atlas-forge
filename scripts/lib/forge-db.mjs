/**
 * Shared guard rails for every script that talks to MySQL.
 *
 * ATLAS Forge shares its production database with other applications (Atlas
 * News, Research Portal). These helpers exist so no script can ever:
 *
 *   - switch to, create, alter or drop a database other than DB_NAME,
 *   - write into a table that has a Forge table's name but belongs to another
 *     application (e.g. a News `users` table),
 *   - run a destructive rebuild against a database other apps also use.
 *
 * Configuration comes ONLY from the process environment, which the npm scripts
 * fill from the project's `.env` (`node --env-file=.env ...`) — the same file
 * PM2 loads for the running application.
 */
import { readFile, readdir } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import * as nodeUtil from 'node:util'
import { TABLE_RENAMES } from '../../src/lib/queries/tables.mjs'

/**
 * Parses a .env file. Uses Node's own parser (the one --env-file uses) when
 * available (Node >= 20.12 / 21.7), otherwise a minimal KEY=VALUE fallback.
 */
export function parseEnvText(text) {
  if (typeof nodeUtil.parseEnv === 'function') return nodeUtil.parseEnv(text)
  const out = {}
  for (const raw of text.split(/\r?\n/)) {
    const m = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if (/^(['"`]).*\1$/.test(v)) v = v.slice(1, -1)
    else v = v.replace(/\s+#.*$/, '')
    out[m[1]] = v
  }
  return out
}

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATABASE_DIR = join(ROOT, 'database')

/* -------------------------------------------------------------------------- */
/* Environment                                                                */
/* -------------------------------------------------------------------------- */

/** DB_* settings from the environment. Exits with a clear message if any required one is missing. */
export function dbEnv() {
  const missing = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter((k) => !process.env[k])
  if (missing.length > 0) {
    console.error(`\nMissing required env vars: ${missing.join(', ')}`)
    console.error('Set them in the project .env (copy .env.example to .env).\n')
    process.exit(1)
  }
  return {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
    connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 10_000),
    ...(['1', 'true', 'yes', 'on'].includes(String(process.env.DB_SSL).toLowerCase())
      ? { ssl: process.env.DB_SSL_CA ? { ca: process.env.DB_SSL_CA } : { rejectUnauthorized: true } }
      : {}),
  }
}

/** `host:port/db as user` — never includes the password. */
export function describe(cfg) {
  return `${cfg.host}:${cfg.port}/${cfg.database} as ${cfg.user} (password ${cfg.password ? 'set' : 'blank'})`
}

/**
 * Next.js also reads these files in production. Under PM2 the app is launched
 * with `--env-file=.env`, so any key `.env` defines wins — but a key `.env`
 * LACKS can still be filled from one of these, which is how a stale file
 * silently changes the running configuration. Reported by db:check and the
 * deploy script.
 */
export const SHADOW_ENV_FILES = ['.env.production.local', '.env.local', '.env.production']

/** Keys whose value differs from `.env`, or that `.env` lacks, per shadow file. */
export function envFileConflicts(dir = process.cwd(), keyFilter = (k) => k.startsWith('DB_')) {
  const read = (name) => {
    const path = join(dir, name)
    return existsSync(path) ? parseEnvText(readFileSync(path, 'utf8')) : null
  }
  const base = read('.env') ?? {}
  const report = []
  for (const name of SHADOW_ENV_FILES) {
    const values = read(name)
    if (!values) continue
    const keys = Object.keys(values).filter(keyFilter)
    report.push({
      file: name,
      fillsMissing: keys.filter((k) => !(k in base)),
      differs: keys.filter((k) => k in base && base[k] !== values[k]),
    })
  }
  return report
}

/* -------------------------------------------------------------------------- */
/* SQL scoping                                                                */
/* -------------------------------------------------------------------------- */

/**
 * SQL files must operate only on the database the connection was opened on
 * (DB_NAME). Anything that names or changes a database is refused outright.
 */
const FORBIDDEN_SQL = [
  [/^\s*USE\s+/im, 'USE <database>'],
  [/\b(CREATE|ALTER|DROP)\s+(DATABASE|SCHEMA)\b/i, 'CREATE/ALTER/DROP DATABASE'],
  [/`atlas-forge-dashboard`/i, 'hard-coded `atlas-forge-dashboard`'],
]

export function assertScopedSql(sql, label) {
  const withoutComments = sql.replace(/^\s*--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
  for (const [pattern, what] of FORBIDDEN_SQL) {
    if (pattern.test(withoutComments)) {
      console.error(`\nRefusing to run ${label}: it contains ${what}.`)
      console.error('SQL files must only touch the database named by DB_NAME.\n')
      process.exit(1)
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Forge table fingerprints                                                   */
/* -------------------------------------------------------------------------- */

// A column line is `name TYPE ...`. Requiring a real SQL type after the name
// skips keys, constraints and continuation lines (`REFERENCES ...`, `NOT NULL`).
const COLUMN_LINE = new RegExp(
  '^\\s*`?([a-z_][a-z0-9_]*)`?\\s+(' +
    'BIGINT|INT|INTEGER|TINYINT|SMALLINT|MEDIUMINT|DECIMAL|NUMERIC|FLOAT|DOUBLE|' +
    'BOOLEAN|BOOL|BIT|CHAR|VARCHAR|BINARY|VARBINARY|TINYTEXT|TEXT|MEDIUMTEXT|' +
    'LONGTEXT|TINYBLOB|BLOB|MEDIUMBLOB|LONGBLOB|ENUM|SET|DATE|DATETIME|TIMESTAMP|' +
    'TIME|YEAR|JSON' +
    ')\\b',
  'i'
)

function parseCreateTables(sql) {
  const tables = new Map()
  const re = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-z0-9_]+)`?\s*\(([\s\S]*?)\n\)\s*ENGINE/gi
  for (const [, name, body] of sql.matchAll(re)) {
    const columns = new Set()
    for (const line of body.split('\n')) {
      const m = line.match(COLUMN_LINE)
      if (m) columns.add(m[1])
    }
    // A table defined in several files keeps only the columns every definition agrees on.
    const prior = tables.get(name)
    tables.set(name, prior ? new Set([...prior].filter((c) => columns.has(c))) : columns)
  }
  return tables
}

/**
 * Map of physical Forge table name (`forge_*`) -> Set of columns its CREATE
 * TABLE defines, parsed from schema.sql + migrations. Throws if that set ever
 * disagrees with the authoritative map in src/lib/queries/tables.mjs.
 */
export async function forgeTables() {
  const files = ['schema.sql', ...(await readdir(join(DATABASE_DIR, 'migrations')))
    .filter((f) => f.endsWith('.sql')).sort().map((f) => `migrations/${f}`)]
  const all = new Map()
  for (const file of files) {
    const parsed = parseCreateTables(await readFile(join(DATABASE_DIR, file), 'utf8'))
    for (const [name, cols] of parsed) {
      const prior = all.get(name)
      all.set(name, prior ? new Set([...prior].filter((c) => cols.has(c))) : cols)
    }
  }
  const mapped = new Set(Object.values(TABLE_RENAMES))
  const extra = [...all.keys()].filter((n) => !mapped.has(n))
  const absent = [...mapped].filter((n) => !all.has(n))
  if (extra.length || absent.length) {
    throw new Error(
      `database/*.sql and src/lib/queries/tables.mjs disagree — in SQL only: ${extra.join(', ') || '-'}; ` +
        `in map only: ${absent.join(', ') || '-'}`
    )
  }
  return all
}

/**
 * Read-only inventory of the connected database (information_schema only).
 *
 *   present    Forge tables that exist under their `forge_` name with every
 *              Forge column
 *   missing    `forge_` tables that do not exist
 *   legacy     Forge tables that still exist under their OLD unprefixed name
 *              (with Forge's columns) — the prefix migration has not run
 *   collisions Forge table names (prefixed, or legacy names) that exist but
 *              are NOT Forge's table — almost certainly another application's
 *   foreign    every other table (other applications)
 */
export async function inspectDatabase(conn) {
  const expected = await forgeTables()
  const [rows] = await conn.query(
    `SELECT TABLE_NAME AS t, COLUMN_NAME AS c
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()`
  )
  const actual = new Map()
  for (const { t, c } of rows) {
    if (!actual.has(t)) actual.set(t, new Set())
    actual.get(t).add(c)
  }
  const present = []
  const missing = []
  const legacy = []
  const collisions = []
  for (const [logical, physical] of Object.entries(TABLE_RENAMES)) {
    const cols = expected.get(physical)
    const lackingIn = (name) => [...cols].filter((c) => !actual.get(name).has(c))

    if (!actual.has(physical)) missing.push(physical)
    else if (lackingIn(physical).length > 0) collisions.push({ name: physical, lacking: lackingIn(physical) })
    else present.push(physical)

    if (actual.has(logical)) {
      // Same columns => Forge's own table, not yet renamed. Otherwise it is
      // some other application's table that merely shares the old name.
      if (lackingIn(logical).length === 0) legacy.push(logical)
    }
  }
  const known = new Set([...expected.keys(), ...legacy])
  const foreign = [...actual.keys()].filter((t) => !known.has(t)).sort()
  return { expected: [...expected.keys()].sort(), present, missing, legacy, collisions, foreign }
}

/**
 * Refuses to write while Forge's tables still carry their old unprefixed
 * names: every SQL file now targets `forge_*`, so running one first would
 * create empty `forge_` tables beside the real ones.
 */
export function assertNotLegacy(inventory, label) {
  if (inventory.legacy.length === 0) return
  console.error(
    `\nRefusing to run ${label}: ${inventory.legacy.length} ATLAS Forge table(s) still use their old ` +
      `unprefixed names (e.g. ${inventory.legacy.slice(0, 3).join(', ')}).\n` +
      'Run the prefix migration first: npm run db:prefix -- --apply\n'
  )
  process.exit(1)
}

/** Refuses to continue when a Forge-named table belongs to another application. */
export function assertNoCollisions(inventory, label) {
  if (inventory.collisions.length === 0) return
  console.error(`\nRefusing to run ${label}: these tables exist in the database but are not ATLAS Forge's:`)
  for (const { name, lacking } of inventory.collisions) {
    console.error(`  - ${name} (lacks Forge columns: ${lacking.slice(0, 5).join(', ')}${lacking.length > 5 ? ', …' : ''})`)
  }
  console.error('Writing to them could damage another application. Nothing was changed.\n')
  process.exit(1)
}
