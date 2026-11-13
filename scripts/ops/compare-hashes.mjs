/**
 * Compares table-hash files produced by table-hashes.mjs.
 *
 *   node compare-hashes.mjs <label> <expected.json> <actual.json> [<expected-alt.json>]
 *
 * Every key must match on row count and sha256. With a second expected file
 * (the "after" snapshot taken around a live dump), a table matches if it equals
 * EITHER snapshot — and is reported as changed-during-window when the two
 * snapshots differ. Exits non-zero on any real mismatch. Prints no row data.
 */
import { readFileSync } from 'node:fs'

const [label, expPath, actPath, altPath] = process.argv.slice(2)
const exp = JSON.parse(readFileSync(expPath, 'utf8'))
const act = JSON.parse(readFileSync(actPath, 'utf8'))
const alt = altPath ? JSON.parse(readFileSync(altPath, 'utf8')) : null
const same = (a, b) => a && b && !a.missing && !b.missing && a.rows === b.rows && a.sha256 === b.sha256

let ok = 0
const window = []
const bad = []
for (const key of new Set([...Object.keys(exp), ...Object.keys(act)])) {
  if (same(exp[key], act[key]) || (alt && same(alt[key], act[key]))) {
    ok += 1
    if (alt && !same(exp[key], alt[key])) window.push(key)
  } else {
    bad.push(`${key}: expected ${exp[key]?.rows ?? '-'} rows ${String(exp[key]?.sha256).slice(0, 12)}, ` +
      `got ${act[key]?.rows ?? '-'} rows ${String(act[key]?.sha256).slice(0, 12)}`)
  }
}
console.log(`  ${label}: ${ok}/${ok + bad.length} tables identical (row count + content sha256)` +
  (window.length ? `; changed in production during the dump window (restore matches one snapshot): ${window.join(', ')}` : ''))
for (const b of bad) console.log(`    MISMATCH ${b}`)
process.exit(bad.length ? 1 : 0)
