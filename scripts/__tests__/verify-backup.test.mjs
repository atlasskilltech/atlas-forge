/**
 * Tests for scripts/ops/verify-backup.mjs — independent backup integrity +
 * structural-completeness + data-presence verification. Streaming, async, no
 * database. Fixtures are written to a temp directory and removed.
 *
 *   node --test scripts/__tests__/verify-backup.test.mjs
 */
import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
import { createHash } from 'node:crypto'
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { verifyBackup } from '../ops/verify-backup.mjs'
import { LOGICAL_TABLES, TABLE_RENAMES } from '../../src/lib/queries/tables.mjs'

const FORGE = Object.values(TABLE_RENAMES) // 46 physical forge_ table names
const dir = mkdtempSync(join(tmpdir(), 'forge-backup-test-'))
after(() => rmSync(dir, { recursive: true, force: true }))

/** A plausible mariadb-dump body. `noInsertFor` omits INSERTs for those tables. */
function dumpText(tables, { complete = true, withDrop = false, noInsertFor = [] } = {}) {
  let s = '-- MariaDB dump 10.19  Distrib 10.11\n--\n'
  if (withDrop) s += 'DROP TABLE IF EXISTS `forge_widget`;\n'
  for (const t of tables) {
    s += `CREATE TABLE \`${t}\` (\n  id bigint unsigned NOT NULL AUTO_INCREMENT,\n  PRIMARY KEY (id)\n) ENGINE=InnoDB;\n`
    if (!noInsertFor.includes(t)) s += `INSERT INTO \`${t}\` VALUES (1),(2);\n`
  }
  if (complete) s += '-- Dump completed on 2026-01-01  0:00:00\n'
  return s
}

/** A content-hash JSON (table-hashes.mjs shape), keyed by LOGICAL name. */
function hashesJson({ rowsEach = 2, missing = [], drop = 0 } = {}) {
  const out = {}
  const logical = LOGICAL_TABLES.slice(0, LOGICAL_TABLES.length - drop)
  for (const l of logical) {
    if (missing.includes(l)) out[l] = { missing: true }
    else out[l] = { table: TABLE_RENAMES[l], rows: rowsEach, sha256: 'x'.repeat(64) }
  }
  return out
}

function writeBackup(name, text, { gz = true, sha = false, badSha = false, hashes = null } = {}) {
  const file = join(dir, `${name}.sql.gz`)
  const bytes = gz ? gzipSync(Buffer.from(text, 'utf8')) : Buffer.from(text, 'utf8')
  writeFileSync(file, bytes)
  if (sha) {
    const digest = badSha ? 'deadbeef'.repeat(8) : createHash('sha256').update(bytes).digest('hex')
    writeFileSync(`${file}.sha256`, `${digest}  ${file}\n`)
  }
  if (hashes !== null) writeFileSync(join(dir, `${name}-hashes.json`), typeof hashes === 'string' ? hashes : JSON.stringify(hashes))
  return file
}

/* --------------------------------------------------- integrity + structure */

test('valid, complete backup of all 46 tables passes', async () => {
  const r = await verifyBackup(writeBackup('valid', dumpText(FORGE)))
  assert.equal(r.ok, true, r.problems.join('; '))
})

test('a valid sha256 sidecar is confirmed; a mismatched one fails', async () => {
  const ok = await verifyBackup(writeBackup('withsha', dumpText(FORGE), { sha: true }))
  assert.equal(ok.ok, true, ok.problems.join('; '))
  assert.ok(ok.notes.some((n) => /sha256 matches/.test(n)))
  const bad = await verifyBackup(writeBackup('badsha', dumpText(FORGE), { sha: true, badSha: true }))
  assert.equal(bad.ok, false)
  assert.ok(bad.problems.some((p) => /sha256 does not match/.test(p)))
})

test('a truncated / non-gzip file fails the integrity check', async () => {
  const r = await verifyBackup(writeBackup('corrupt', 'not actually gzip', { gz: false }))
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /valid gzip|truncated/i.test(p)), r.problems.join('; '))
})

test('a genuinely truncated gzip stream fails', async () => {
  const full = gzipSync(Buffer.from(dumpText(FORGE)))
  const file = join(dir, 'trunc.sql.gz')
  writeFileSync(file, full.subarray(0, Math.floor(full.length / 2)))
  const r = await verifyBackup(file)
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /valid gzip|truncated/i.test(p)), r.problems.join('; '))
})

test('empty file, missing completion marker, and DROP are each rejected', async () => {
  assert.equal((await verifyBackup(writeBackup('empty', '', { gz: false }))).ok, false)
  const noMark = await verifyBackup(writeBackup('incomplete', dumpText(FORGE, { complete: false })))
  assert.ok(noMark.problems.some((p) => /incomplete|Dump completed/i.test(p)))
  const drop = await verifyBackup(writeBackup('withdrop', dumpText(FORGE, { withDrop: true })))
  assert.ok(drop.problems.some((p) => /DROP TABLE/i.test(p)))
})

test('a dump missing one Forge table is rejected', async () => {
  const r = await verifyBackup(writeBackup('missing1', dumpText(FORGE.slice(0, FORGE.length - 1))))
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /missing .*Forge table/i.test(p)), r.problems.join('; '))
})

/* --------------------------------------------------- data presence (V2 / T2) */

test('T2: valid content-hash JSON with matching INSERT data passes', async () => {
  const r = await verifyBackup(writeBackup('hashok', dumpText(FORGE), { hashes: hashesJson({ rowsEach: 2 }) }))
  assert.equal(r.ok, true, r.problems.join('; '))
  assert.ok(r.notes.some((n) => /expected rows/.test(n)))
})

test('T2: a table with rows per content-hash but NO INSERT in the dump fails', async () => {
  const omit = FORGE[3]
  const r = await verifyBackup(writeBackup('nodata', dumpText(FORGE, { noInsertFor: [omit] }), { hashes: hashesJson({ rowsEach: 5 }) }))
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /NO INSERT data/i.test(p) && p.includes(omit)), r.problems.join('; '))
})

test('T2: an empty table (0 rows per content-hash) with no INSERT is allowed', async () => {
  // One table legitimately empty: hashes says rows:0, dump omits its INSERT → OK.
  const emptyLogical = LOGICAL_TABLES[5]
  const h = hashesJson({ rowsEach: 2 })
  h[emptyLogical] = { table: TABLE_RENAMES[emptyLogical], rows: 0, sha256: 'y'.repeat(64) }
  const r = await verifyBackup(writeBackup('emptytbl', dumpText(FORGE, { noInsertFor: [TABLE_RENAMES[emptyLogical]] }), { hashes: h }))
  assert.equal(r.ok, true, r.problems.join('; '))
})

test('T2: incomplete content-hash JSON (fewer than 46 tables) fails', async () => {
  const r = await verifyBackup(writeBackup('hashfew', dumpText(FORGE), { hashes: hashesJson({ drop: 3 }) }))
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /covers only/.test(p)), r.problems.join('; '))
})

test('T2: content-hash JSON reporting a missing table fails', async () => {
  const r = await verifyBackup(writeBackup('hashmiss', dumpText(FORGE), { hashes: hashesJson({ missing: [LOGICAL_TABLES[0]] }) }))
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /missing table/i.test(p)), r.problems.join('; '))
})

test('T2: malformed content-hash JSON fails', async () => {
  const r = await verifyBackup(writeBackup('hashbad', dumpText(FORGE), { hashes: '{ not valid json' }))
  assert.equal(r.ok, false)
  assert.ok(r.problems.some((p) => /content-hash JSON is invalid/.test(p)), r.problems.join('; '))
})

test('T2: without a content-hash JSON, data presence is reported as not independently verified', async () => {
  const r = await verifyBackup(writeBackup('nohashes', dumpText(FORGE)))
  assert.equal(r.ok, true, r.problems.join('; '))
  assert.ok(r.notes.some((n) => /NOT independently verified/.test(n)))
})
