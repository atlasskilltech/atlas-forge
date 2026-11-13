/**
 * Tests for the ATLAS Forge migration core.
 *
 *   node --test scripts/__tests__/migrate.test.mjs
 *
 * Pure tests run with no database. The rehearsal group runs against a DEDICATED
 * local database (default 127.0.0.1 root/blank, overridable via TEST_DB_*). It
 * NEVER uses .env.local (which points at production) and NEVER connects to a
 * remote host — if a local MySQL/MariaDB is not reachable, that group is skipped.
 */
import test, { before, after } from 'node:test'
import assert from 'node:assert/strict'
import mysql from 'mysql2/promise'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  analyseUp, analyseDown, classifyUp, classifyMigration, splitStatements, stripComments,
  checksum, validateMigrations, computeStatus, applyPending, recordBaseline, migrateDown,
  withLock, mysqlAdapter, BOOKKEEPING_TABLE,
} from '../lib/migrate-core.mjs'
import { ROOT } from '../lib/forge-db.mjs'
import { snapshotForge, diffForge, buildExpectedFromSchemaSql } from '../lib/schema-fingerprint.mjs'

/* ------------------------------------------------------------- pure: parsing */

test('analyseUp accepts CREATE TABLE IF NOT EXISTS forge_*', () => {
  const a = analyseUp('CREATE TABLE IF NOT EXISTS forge_widget (id INT PRIMARY KEY)')
  assert.equal(a.kind, 'create'); assert.equal(a.table, 'forge_widget')
})

test('analyseUp accepts CREATE TABLE with FK ON DELETE/ON UPDATE actions (H1)', () => {
  const a = analyseUp('CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY, b INT, CONSTRAINT fk FOREIGN KEY (b) REFERENCES forge_b (id) ON DELETE CASCADE ON UPDATE CASCADE)')
  assert.deepEqual(a.refs.sort(), ['forge_a', 'forge_b'])
})

test('analyseUp accepts additive ALTER ... ADD IF NOT EXISTS (multiple clauses)', () => {
  const a = analyseUp('ALTER TABLE forge_users ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) NULL, ADD KEY IF NOT EXISTS idx_forge_users_nick (nickname)')
  assert.equal(a.kind, 'alter_add'); assert.equal(a.table, 'forge_users')
})

test('analyseUp requires IF NOT EXISTS on CREATE TABLE (M1)', () => {
  assert.throws(() => analyseUp('CREATE TABLE forge_x (id INT PRIMARY KEY)'), /IF NOT EXISTS/i)
})
test('analyseUp requires IF NOT EXISTS on ADD COLUMN (M1)', () => {
  assert.throws(() => analyseUp('ALTER TABLE forge_x ADD COLUMN y INT NULL'), /IF NOT EXISTS/i)
})

for (const [label, sql] of [
  ['DROP TABLE', 'DROP TABLE forge_widget'],
  ['ALTER DROP COLUMN', 'ALTER TABLE forge_users DROP COLUMN nickname'],
  ['ALTER MODIFY', 'ALTER TABLE forge_users MODIFY COLUMN email VARCHAR(500)'],
  ['TRUNCATE', 'TRUNCATE TABLE forge_users'],
  ['RENAME', 'RENAME TABLE forge_users TO forge_people'],
  ['INSERT', "INSERT INTO forge_roles (slug) VALUES ('x')"],
  ['non-forge table', 'CREATE TABLE IF NOT EXISTS news_posts (id INT PRIMARY KEY)'],
  ['foreign REFERENCES', 'CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY, b INT, FOREIGN KEY (b) REFERENCES survey_users (id))'],
  ['qualified name', 'CREATE TABLE IF NOT EXISTS mydb.forge_a (id INT PRIMARY KEY)'],
  ['LIKE clone (H2)', 'CREATE TABLE IF NOT EXISTS forge_x (LIKE news_posts)'],
  ['NOT NULL without DEFAULT (C1)', 'ALTER TABLE forge_x ADD COLUMN IF NOT EXISTS a INT NOT NULL'],
]) {
  test(`analyseUp REJECTS ${label}`, () => { assert.throws(() => analyseUp(sql)) })
}

test('analyseUp ACCEPTS NOT NULL column WITH a DEFAULT', () => {
  assert.doesNotThrow(() => analyseUp('ALTER TABLE forge_x ADD COLUMN IF NOT EXISTS a INT NOT NULL DEFAULT 0'))
})

/* ------------------------------------------------------------- pure: classification (C1) */

test('classifyUp: nullable / defaulted column adds are online-safe', () => {
  assert.equal(classifyUp('ALTER TABLE forge_x ADD COLUMN IF NOT EXISTS a INT NULL').onlineSafe, true)
  assert.equal(classifyUp('ALTER TABLE forge_x ADD COLUMN IF NOT EXISTS a INT NOT NULL DEFAULT 0').onlineSafe, true)
  assert.equal(classifyUp('CREATE TABLE IF NOT EXISTS forge_x (id INT PRIMARY KEY)').onlineSafe, true)
  assert.equal(classifyUp('CREATE INDEX IF NOT EXISTS idx_x ON forge_x (a)').onlineSafe, true)
})

test('classifyUp: UNIQUE / FOREIGN KEY / CHECK / UNIQUE INDEX are maintenance-only', () => {
  for (const sql of [
    'ALTER TABLE forge_x ADD UNIQUE KEY IF NOT EXISTS uq_x (a)',
    'ALTER TABLE forge_x ADD CONSTRAINT IF NOT EXISTS fk FOREIGN KEY (b) REFERENCES forge_y (id)',
    'ALTER TABLE forge_x ADD CONSTRAINT IF NOT EXISTS ck CHECK (a > 0)',
    'CREATE UNIQUE INDEX IF NOT EXISTS uq_x ON forge_x (a)',
  ]) {
    const c = classifyUp(sql)
    assert.equal(c.onlineSafe, false, sql)
    assert.equal(c.backwardCompatible, false, sql)
  }
})

/* ------------------------------------------------------------- pure: down + pairing (M2) */

test('analyseDown allows paired DROPs on forge_, rejects non-forge', () => {
  assert.equal(analyseDown('DROP TABLE forge_widget').token, 'table:forge_widget')
  assert.equal(analyseDown('ALTER TABLE forge_users DROP COLUMN IF EXISTS nickname').token, 'col:forge_users:nickname')
  assert.throws(() => analyseDown('DROP TABLE news_posts'))
})

test('validateMigrations requires pairedDown when a down exists', () => {
  assert.throws(() => validateMigrations([
    { id: '0105_x', source: 'managed', up: ['CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY)'], down: ['DROP TABLE IF EXISTS forge_a'] },
  ]), /pairedDown/i)
})
test('validateMigrations rejects a down that is not the paired inverse', () => {
  assert.throws(() => validateMigrations([
    { id: '0104_x', source: 'managed', pairedDown: true, up: ['CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY)'], down: ['DROP TABLE IF EXISTS forge_b'] },
  ]), /does not reverse|its own up creates/i)
})
test('validateMigrations accepts a correctly paired migration', () => {
  assert.doesNotThrow(() => validateMigrations([
    { id: '0103_x', source: 'managed', pairedDown: true, up: ['CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY)'], down: ['DROP TABLE IF EXISTS forge_a'] },
  ]))
})
test('validateMigrations forbids a managed CREATE of a baseline table', () => {
  assert.throws(() => validateMigrations([
    { id: '0106_x', source: 'managed', up: ['CREATE TABLE IF NOT EXISTS forge_users (id INT PRIMARY KEY)'], down: [] },
  ]), /baseline table/i)
})

/* ------------------------------------------------------------- pure: splitting + checksum */

test('splitStatements ignores semicolons in literals and comments', () => {
  const parts = splitStatements(`
    -- a comment; not a split
    CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY, note VARCHAR(10) DEFAULT 'x;y');
    /* block; comment */
    CREATE TABLE IF NOT EXISTS forge_b (id INT PRIMARY KEY);
  `)
  assert.equal(parts.length, 2)
})
test('stripComments keeps literals', () => {
  assert.equal(stripComments("A 'x--y' -- tail").trim(), "A 'x--y'")
})
test('checksum is whitespace-stable and content-sensitive', () => {
  const a = { id: '0100_x', source: 'managed', up: ['CREATE TABLE IF NOT EXISTS forge_x (id INT PRIMARY KEY)'], down: [] }
  const b = { id: '0100_x', source: 'managed', up: ['CREATE TABLE IF NOT EXISTS   forge_x   (id INT PRIMARY KEY)'], down: [] }
  const c = { id: '0100_x', source: 'managed', up: ['CREATE TABLE IF NOT EXISTS forge_x (id BIGINT PRIMARY KEY)'], down: [] }
  assert.equal(checksum(a), checksum(b)); assert.notEqual(checksum(a), checksum(c))
})
test('validateMigrations accepts baseline entries without parsing their body', () => {
  assert.doesNotThrow(() => validateMigrations([
    { id: '0011_network_member_role', source: 'baseline', up: ["INSERT INTO forge_roles (slug) VALUES ('network-member')"], down: [] },
    { id: '013_forge_prefix', source: 'baseline', fingerprint: '{"users":"forge_users"}' },
  ]))
})

/* ------------------------------------------------------------- rehearsal (local DB) */

const TEST = {
  host: process.env.TEST_DB_HOST || '127.0.0.1',
  port: Number(process.env.TEST_DB_PORT || 3306),
  user: process.env.TEST_DB_USER || 'root',
  password: process.env.TEST_DB_PASSWORD ?? '',
  database: process.env.TEST_DB_NAME || 'forge_migrate_test',
}
assert.ok(['localhost', '127.0.0.1', '::1'].includes(TEST.host), 'rehearsal DB must be local')

let dbReady = false
let serverVersion = '?'
let root, conn, db

async function resetDb() {
  // Clear any session vars a prior migration run left on this shared connection
  // (applyPending pins alter_algorithm/lock_wait_timeout for its own session).
  await conn.query('SET SESSION alter_algorithm = DEFAULT').catch(() => {})
  await conn.query('SET SESSION lock_wait_timeout = DEFAULT').catch(() => {})
  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  const [rows] = await conn.query("SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_TYPE = 'BASE TABLE'")
  for (const { t } of rows) await conn.query(`DROP TABLE IF EXISTS \`${t}\``)
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')
}

before(async () => {
  try {
    root = await mysql.createConnection({ host: TEST.host, port: TEST.port, user: TEST.user, password: TEST.password, connectTimeout: 4000, multipleStatements: true })
    await root.query(`DROP DATABASE IF EXISTS \`${TEST.database}\``)
    await root.query(`CREATE DATABASE \`${TEST.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    conn = await mysql.createConnection({ host: TEST.host, port: TEST.port, user: TEST.user, password: TEST.password, database: TEST.database, multipleStatements: true })
    db = mysqlAdapter(conn)
    const [[v]] = await conn.query('SELECT VERSION() v'); serverVersion = v.v
    dbReady = true
  } catch (e) {
    console.error(`  (local DB not reachable: ${e.code || e.message} — rehearsal skipped)`)
  }
})

after(async () => {
  if (conn) await conn.end()
  if (root) { await root.query(`DROP DATABASE IF EXISTS \`${TEST.database}\``); await root.end() }
})

const dbTest = (name, fn) => test(name, async (t) => { if (!dbReady) return t.skip('local DB unavailable'); return fn(t) })

const WIDGET = {
  id: '0100_create_widget', source: 'managed', description: 'create the widget table', pairedDown: true,
  up: ['CREATE TABLE IF NOT EXISTS forge_widget (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL) ENGINE=InnoDB'],
  down: ['DROP TABLE IF EXISTS forge_widget'],
}

dbTest('status → up applies pending → re-run is a no-op', async () => {
  await resetDb()
  let s = await computeStatus(db, [WIDGET])
  assert.deepEqual(s.pending.map((p) => p.id), ['0100_create_widget'])
  assert.equal(s.pending[0].onlineSafe, true)

  const r = await applyPending(db, [WIDGET], { log: () => {} })
  assert.deepEqual(r.applied, ['0100_create_widget'])
  assert.equal((await conn.query("SHOW TABLES LIKE 'forge_widget'"))[0].length, 1)

  s = await computeStatus(db, [WIDGET])
  assert.deepEqual(s.pending, [])
  assert.deepEqual((await applyPending(db, [WIDGET], { log: () => {} })).applied, [])
})

dbTest('edited applied migration is detected (immutable history)', async () => {
  await resetDb()
  await applyPending(db, [WIDGET], { log: () => {} })
  const edited = { ...WIDGET, up: ['CREATE TABLE IF NOT EXISTS forge_widget (id BIGINT PRIMARY KEY, name VARCHAR(80) NOT NULL) ENGINE=InnoDB'] }
  const s = await computeStatus(db, [edited])
  assert.ok(s.problems.some((p) => /has been edited/.test(p)), s.problems.join('; '))
})

dbTest('foreign (news_/survey_) tables are never touched', async () => {
  await resetDb()
  await conn.query('CREATE TABLE news_posts (id INT PRIMARY KEY, title VARCHAR(10)) ENGINE=InnoDB')
  await conn.query("INSERT INTO news_posts (id, title) VALUES (1, 'keep')")
  await applyPending(db, [WIDGET], { log: () => {} })
  assert.equal((await conn.query('SELECT title FROM news_posts WHERE id = 1'))[0][0].title, 'keep')
})

dbTest('C1: previous-release inserts keep working after an online-safe column add (STRICT_TRANS_TABLES)', async () => {
  await resetDb()
  await conn.query('CREATE TABLE forge_widget (id INT PRIMARY KEY, name VARCHAR(50) NOT NULL) ENGINE=InnoDB')
  const old = await mysql.createConnection({ host: TEST.host, port: TEST.port, user: TEST.user, password: TEST.password, database: TEST.database })
  await old.query("SET SESSION sql_mode = 'STRICT_TRANS_TABLES'")
  await old.query("INSERT INTO forge_widget (id, name) VALUES (1, 'a')")
  const mig = {
    id: '0101_add_cols', source: 'managed', pairedDown: true, description: 'nullable + defaulted',
    up: [
      'ALTER TABLE forge_widget ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) NULL',
      'ALTER TABLE forge_widget ADD COLUMN IF NOT EXISTS score INT NOT NULL DEFAULT 0',
    ],
    down: [
      'ALTER TABLE forge_widget DROP COLUMN IF EXISTS score',
      'ALTER TABLE forge_widget DROP COLUMN IF EXISTS nickname',
    ],
  }
  await applyPending(db, [mig], { log: () => {} })
  // The PREVIOUS release (unchanged SQL, omitting new columns) still inserts under STRICT mode.
  await old.query("INSERT INTO forge_widget (id, name) VALUES (2, 'b')")
  assert.equal((await old.query('SELECT COUNT(*) n FROM forge_widget'))[0][0].n, 2)
  await old.end()
})

dbTest('C1: a UNIQUE/FK migration is refused on the online path, allowed only with maintenance', async () => {
  await resetDb()
  await conn.query('CREATE TABLE forge_widget (id INT PRIMARY KEY, email VARCHAR(50)) ENGINE=InnoDB')
  const uniq = {
    id: '0102_uniq', source: 'managed', pairedDown: true, description: 'unique email',
    up: ['ALTER TABLE forge_widget ADD UNIQUE KEY IF NOT EXISTS uq_widget_email (email)'],
    down: ['ALTER TABLE forge_widget DROP INDEX IF EXISTS uq_widget_email'],
  }
  await assert.rejects(applyPending(db, [uniq], { log: () => {} }), /maintenance-window-only/i)
  assert.deepEqual((await applyPending(db, [uniq], { maintenance: true, log: () => {} })).applied, ['0102_uniq'])
})

dbTest('C2: a migration behind a held metadata lock fails within a bounded time (no hang)', async () => {
  await resetDb()
  await conn.query('CREATE TABLE forge_widget (id INT PRIMARY KEY) ENGINE=InnoDB')
  const blocker = await mysql.createConnection({ host: TEST.host, port: TEST.port, user: TEST.user, password: TEST.password, database: TEST.database })
  await blocker.query('LOCK TABLES forge_widget WRITE')
  try {
    const mig = {
      id: '0107_add', source: 'managed', pairedDown: true, description: 'add col',
      up: ['ALTER TABLE forge_widget ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) NULL'],
      down: ['ALTER TABLE forge_widget DROP COLUMN IF EXISTS nickname'],
    }
    const start = Date.now()
    await assert.rejects(applyPending(db, [mig], { lockWaitTimeout: 1, maxStatementTime: 5, log: () => {} }))
    const elapsed = Date.now() - start
    assert.ok(elapsed < 20000, `should be bounded, took ${elapsed}ms`)
    const [[c]] = await conn.query("SELECT COUNT(*) n FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'forge_widget' AND COLUMN_NAME = 'nickname'")
    assert.equal(c.n, 0, 'column must not have been added')
  } finally {
    await blocker.query('UNLOCK TABLES'); await blocker.end()
  }
})

dbTest('M1: failed migration leaves no history, re-runs to completion (idempotent)', async () => {
  await resetDb()
  const bad = {
    id: '0106_two_step', source: 'managed', pairedDown: true, description: 'fk to a not-yet-existing table',
    up: [
      'CREATE TABLE IF NOT EXISTS forge_a (id INT PRIMARY KEY) ENGINE=InnoDB',
      'CREATE TABLE IF NOT EXISTS forge_b (id INT PRIMARY KEY, a INT, CONSTRAINT fk_b FOREIGN KEY (a) REFERENCES forge_missing (id)) ENGINE=InnoDB',
    ],
    down: ['DROP TABLE IF EXISTS forge_b', 'DROP TABLE IF EXISTS forge_a'],
  }
  await assert.rejects(applyPending(db, [bad], { log: () => {} }))
  assert.equal((await conn.query("SHOW TABLES LIKE 'forge_a'"))[0].length, 1, 'forge_a remains (no auto-drop)')
  assert.equal((await conn.query("SHOW TABLES LIKE 'forge_b'"))[0].length, 0)
  assert.equal((await conn.query(`SELECT COUNT(*) n FROM ${BOOKKEEPING_TABLE}`))[0][0].n, 0)
  // Fix the cause, re-run: forge_a's CREATE IF NOT EXISTS is a no-op, forge_b is created.
  await conn.query('CREATE TABLE IF NOT EXISTS forge_missing (id INT PRIMARY KEY) ENGINE=InnoDB')
  assert.deepEqual((await applyPending(db, [bad], { log: () => {} })).applied, ['0106_two_step'])
})

dbTest('M2: down needs confirm AND verified backup, then reverses the paired inverse', async () => {
  await resetDb()
  await applyPending(db, [WIDGET], { log: () => {} })
  await assert.rejects(migrateDown(db, [WIDGET], { confirm: true }), /verified backup/i)
  await assert.rejects(migrateDown(db, [WIDGET], { confirm: false, backupVerified: true }), /confirmation/i)
  const r = await migrateDown(db, [WIDGET], { confirm: true, backupVerified: true, log: () => {} })
  assert.equal(r.reverted, '0100_create_widget')
  assert.equal((await conn.query("SHOW TABLES LIKE 'forge_widget'"))[0].length, 0)
})

dbTest('lock serialises runners', async () => {
  await resetDb()
  const other = await mysql.createConnection({ host: TEST.host, port: TEST.port, user: TEST.user, password: TEST.password, database: TEST.database })
  try {
    await other.query("SELECT GET_LOCK('forge_schema_migrate', 5)")
    await assert.rejects(withLock(db, async () => 'x', 1), /lock not acquired/i)
  } finally {
    await other.query("SELECT RELEASE_LOCK('forge_schema_migrate')"); await other.end()
  }
})

dbTest('H3: baseline STRUCTURAL verify records on a matching schema and aborts on a mismatch', async () => {
  await resetDb()
  const schemaSql = await readFile(join(ROOT, 'database', 'schema.sql'), 'utf8')
  // Build the real forge schema in the test DB (the "live" side).
  await conn.query(schemaSql)
  // Expected fingerprint from the same schema.sql (independent scratch DB).
  const expected = await buildExpectedFromSchemaSql(TEST, schemaSql, `forge_expect_${process.pid}`)
  const verify = async () => {
    const actual = await snapshotForge(conn)
    const problems = diffForge(expected, actual)
    return { ok: problems.length === 0, problems, summary: 'structural' }
  }
  const baseline = [
    { id: '0001_init', source: 'baseline', up: ['-- recorded only'], down: [] },
    { id: '013_forge_prefix', source: 'baseline', fingerprint: '{"users":"forge_users"}' },
  ]
  // Matching schema → records.
  const r = await recordBaseline(db, baseline, { verifySchema: verify, log: () => {} })
  assert.deepEqual(r.recorded.sort(), ['0001_init', '013_forge_prefix'])
  // Mutate the live schema (drop an index) → structural mismatch → abort on a fresh baseline.
  await resetDb(); await conn.query(schemaSql)
  await conn.query('ALTER TABLE forge_users DROP INDEX idx_users_status')
  await assert.rejects(recordBaseline(db, baseline, { verifySchema: verify, log: () => {} }), /ABORTED/i)
})

dbTest('baseline refuses to re-baseline (stub verify)', async () => {
  await resetDb()
  const base = [{ id: '0001_init', source: 'baseline', up: ['-- recorded only'], down: [] }]
  const ok = async () => ({ ok: true, problems: [], summary: 'stub' })
  await recordBaseline(db, base, { verifySchema: ok, log: () => {} })
  await assert.rejects(recordBaseline(db, base, { verifySchema: ok, log: () => {} }), /already recorded/i)
})

test('rehearsal server version', () => { if (dbReady) console.log(`    [rehearsal MariaDB/MySQL version: ${serverVersion}]`) })
