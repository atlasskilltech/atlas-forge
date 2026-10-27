/**
 * Verification of the University Student Application ID feature.
 *
 *   npm run test:student-verification     (expects a dev server on $BASE_URL)
 *
 * Two layers:
 *   1. Pure unit tests of the fail-closed interpreter (no network).
 *   2. End-to-end HTTP tests of the verification route and the registration
 *      submit gate, then a DB cleanup of every row this script created.
 *
 * It creates registration rows with `*@studentcheck.test` emails and deletes
 * them again — nothing is left behind.
 */

import { createConnection } from 'mysql2/promise'
import {
  ERROR,
  interpretResponse,
  NOT_FOUND,
  VERIFIED,
} from '../src/lib/services/student-verification.logic.js'

const BASE = process.env.BASE_URL ?? 'http://localhost:3001'
// A known-good UAT application id and one that does not exist.
const VALID_ID = process.env.STUDENT_CHECK_VALID_ID ?? '2629885'
const INVALID_ID = 'NOPE-000-DOES-NOT-EXIST'
const TAG = Date.now().toString(36)
const email = (who) => `sc-${who}-${TAG}@studentcheck.test`

const pass = []
const fail = []
const check = (name, ok, detail = '') => (ok ? pass : fail).push(`${name}${detail ? ` — ${detail}` : ''}`)

async function call(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await response.json().catch(() => null)
  return { status: response.status, json }
}

const student = (extra) => ({
  fullName: 'Student Check Test',
  roleCategory: 'atlas_student',
  consent: true,
  school: 'isdi',
  portfolioLink: 'example.com/work',
  ...extra,
})

/* -------------------------------------------------------------------------- */
/* 1 · Pure interpreter — fails closed                                        */
/* -------------------------------------------------------------------------- */

check('interpret: exists:true → verified', interpretResponse({ httpOk: true, body: { status: 1, data: { exists: true } } }).status === VERIFIED)
check('interpret: exists:false → not_found', interpretResponse({ httpOk: true, body: { status: 1, data: { exists: false } } }).status === NOT_FOUND)
check('interpret: HTTP error → error (fail closed)', interpretResponse({ httpOk: false, body: { status: 1, data: { exists: true } } }).status === ERROR)
check('interpret: status!=1 → error', interpretResponse({ httpOk: true, body: { status: 0, msg: 'x' } }).status === ERROR)
check('interpret: missing exists → error', interpretResponse({ httpOk: true, body: { status: 1, data: {} } }).status === ERROR)
check('interpret: non-boolean exists → error', interpretResponse({ httpOk: true, body: { status: 1, data: { exists: 'true' } } }).status === ERROR)
check('interpret: malformed/null body → error', interpretResponse({ httpOk: true, body: null }).status === ERROR)

/* -------------------------------------------------------------------------- */
/* 2 · Verification route                                                     */
/* -------------------------------------------------------------------------- */

const vValid = await call('/api/landing/student-verification', { method: 'POST', body: { applicationId: VALID_ID } })
check('route: valid id → 200 verified', vValid.status === 200 && vValid.json?.data?.status === 'verified', `got ${vValid.status} ${JSON.stringify(vValid.json)}`)

const vInvalid = await call('/api/landing/student-verification', { method: 'POST', body: { applicationId: INVALID_ID } })
check('route: invalid id → 200 not_found', vInvalid.status === 200 && vInvalid.json?.data?.status === 'not_found', `got ${vInvalid.status}`)

const vBlank = await call('/api/landing/student-verification', { method: 'POST', body: { applicationId: '   ' } })
check('route: blank id → 422', vBlank.status === 422)

const vGet = await call('/api/landing/student-verification', { method: 'GET' })
check('route: GET → 405', vGet.status === 405)

/* -------------------------------------------------------------------------- */
/* 3 · Registration submit gate                                               */
/* -------------------------------------------------------------------------- */

const sNoId = await call('/api/landing/registrations', { method: 'POST', body: student({ email: email('noid') }) })
check('submit: student without id → 422', sNoId.status === 422 && Boolean(sNoId.json?.error?.details?.fields?.studentApplicationId))

// Bypass attempt: invalid id plus a forged `verified:true` the server must ignore.
const sBypass = await call('/api/landing/registrations', { method: 'POST', body: student({ email: email('bypass'), studentApplicationId: INVALID_ID, verified: true }) })
check('submit: invalid id + forged verified:true → 422 (no bypass)', sBypass.status === 422)

const sValid = await call('/api/landing/registrations', { method: 'POST', body: student({ email: email('valid'), studentApplicationId: VALID_ID }) })
check('submit: valid id → 201', sValid.status === 201 && Boolean(sValid.json?.data?.reference))

const sOther = await call('/api/landing/registrations', { method: 'POST', body: { fullName: 'Other Check', email: email('other'), roleCategory: 'others', consent: true, organisation: 'Acme', designation: 'Lead', portfolioLink: 'example.com/a' } })
check('submit: non-student without id → 201 (no university call)', sOther.status === 201)

/* -------------------------------------------------------------------------- */
/* 4 · Existing public API behaviour unchanged                                */
/* -------------------------------------------------------------------------- */

const list = await call('/api/public/registrations?perPage=2')
check('public list: unchanged shape (registrations + pagination)', list.status === 200 && Array.isArray(list.json?.data?.registrations) && Boolean(list.json?.data?.pagination))

const lookup = await call(`/api/public/registrations?applicationId=${encodeURIComponent(VALID_ID)}`)
check('public lookup: finds the stored verified student', lookup.status === 200 && lookup.json?.data?.lookup?.found === true && lookup.json?.data?.lookup?.student?.studentApplicationId === VALID_ID)

/* -------------------------------------------------------------------------- */
/* Cleanup — remove every row this run created                                */
/* -------------------------------------------------------------------------- */

let cleaned = 0
try {
  const db = await createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })
  const [result] = await db.query('DELETE FROM registration_requests WHERE email LIKE ?', [`sc-%-${TAG}@studentcheck.test`])
  cleaned = result.affectedRows
  await db.end()
} catch (error) {
  fail.push(`cleanup failed — ${error.message} (remove sc-%@studentcheck.test rows manually)`)
}
check('cleanup: test rows removed', cleaned >= 2, `${cleaned} deleted`)

/* -------------------------------------------------------------------------- */

console.log(`\n${pass.length} passed, ${fail.length} failed\n`)
for (const line of pass) console.log(`  ✓ ${line}`)
for (const line of fail) console.log(`  ✗ ${line}`)
process.exit(fail.length === 0 ? 0 : 1)
