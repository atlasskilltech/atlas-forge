/**
 * Compares two investigate-prefix.mjs JSON reports — a pre-migration baseline
 * and a current one — and checks the post-migration conditions:
 *
 *   - all 46 Forge tables exist under forge_ names, none under legacy names
 *   - every Forge table keeps its columns, indexes, FKs and constraints
 *     (fingerprints are rename-invariant)
 *   - no Forge table has fewer rows than in the baseline (new rows from live
 *     use are reported, losses fail)
 *   - every other application's table still exists with identical structure
 *
 *   node compare-investigations.mjs <baseline.json> <current.json>
 * Prints counts and table names only. Exit 1 on any failed condition.
 */
import { readFileSync } from 'node:fs'

const [before, after] = process.argv.slice(2).map((f) => JSON.parse(readFileSync(f, 'utf8')))
let failed = 0
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'OK  ' : 'FAIL'}  ${label}${detail ? ` — ${detail}` : ''}`)
  if (!ok) failed += 1
}

const B = new Map(before.forge.map((r) => [r.logical, r]))
const A = new Map(after.forge.map((r) => [r.logical, r]))

const prefixed = after.forge.filter((r) => r.prefixedExists && r.physical === `forge_${r.logical}`)
check('all 46 Forge tables have the forge_ prefix', prefixed.length === 46, `${prefixed.length}/46`)
const legacyLeft = after.forge.filter((r) => r.legacyExists).map((r) => r.logical)
check('no old unprefixed Forge tables remain', legacyLeft.length === 0, legacyLeft.join(', ') || '0 remain')
const notForge = after.forge.filter((r) => !r.isForge).map((r) => r.logical)
check('every forge_ table carries all Forge columns', notForge.length === 0, notForge.join(', '))

const structDiff = []
for (const [name, b] of B) {
  const a = A.get(name)
  for (const k of ['columns', 'indexes', 'foreignKeys', 'constraints']) {
    if (b.fingerprint?.[k] !== a?.fingerprint?.[k]) structDiff.push(`${name}.${k}`)
  }
}
check('columns, indexes, foreign keys and constraints identical to baseline (46 tables)', structDiff.length === 0, structDiff.join(', '))

const before0 = before.forge.reduce((s, r) => s + (r.rows ?? 0), 0)
const after0 = after.forge.reduce((s, r) => s + (r.rows ?? 0), 0)
const lost = []
const grew = []
for (const [name, b] of B) {
  const a = A.get(name)
  if ((a?.rows ?? -1) < b.rows) lost.push(`${name} ${b.rows}->${a?.rows}`)
  else if (a.rows > b.rows) grew.push(`${name} +${a.rows - b.rows}`)
}
check(`no Forge records lost (baseline ${before0} rows, now ${after0})`, lost.length === 0,
  lost.length ? lost.join(', ') : grew.length ? `new rows from live use since baseline: ${grew.join(', ')}` : 'identical counts')

const bo = before.otherFingerprints ?? {}
const ao = after.otherFingerprints ?? {}
const missing = Object.keys(bo).filter((n) => !(n in ao))
const added = Object.keys(ao).filter((n) => !(n in bo))
const changed = Object.keys(bo).filter((n) => n in ao &&
  ['type', 'columns', 'indexes', 'foreignKeys', 'constraints'].some((k) => bo[n][k] !== ao[n][k]))
check(`other projects' tables all present (${Object.keys(bo).length} in baseline)`, missing.length === 0, missing.join(', '))
check('other projects\' tables structurally unchanged', changed.length === 0, changed.join(', '))
if (added.length) console.log(`  note  tables added by other projects since baseline: ${added.join(', ')}`)

console.log(failed ? `\n  ${failed} post-migration condition(s) FAILED\n` : '\n  all post-migration conditions met\n')
process.exit(failed ? 1 : 0)
