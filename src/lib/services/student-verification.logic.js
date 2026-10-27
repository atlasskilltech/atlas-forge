/**
 * Pure interpretation of the university Student-check reply.
 *
 * Deliberately free of `server-only`, env and network imports so it can be unit
 * tested directly (scripts/verify-student-verification.mjs). The networked
 * wrapper lives in `student-verification.service.js`.
 *
 * Confirmed response contract (UAT):
 *   exists:    HTTP 200  {"status":1,"data":{"app_id":"…","exists":true}}
 *   not found: HTTP 200  {"status":1,"data":{"app_id":"…","exists":false}}
 *   bad input: HTTP 400  {"status":0,"msg":"app_id is required"}
 *   bad key:   HTTP 401  {"status":0,"msg":"Unauthorized"}
 *
 * The authoritative signal is `data.exists === true`, and only when the HTTP
 * response is ok and `status === 1`.
 */

/** @typedef {'verified' | 'not_found' | 'error'} VerificationStatus */

export const VERIFIED = 'verified'
export const NOT_FOUND = 'not_found'
export const ERROR = 'error'

/**
 * Fails closed: anything that is not unambiguously `exists:true` or
 * `exists:false` from a 200/`status:1` reply is an `error` — never a pass.
 *
 * @param {{ httpOk: boolean, body: unknown }} reply
 * @returns {{ status: VerificationStatus, reason?: string }}
 */
export function interpretResponse({ httpOk, body }) {
  if (!httpOk) return { status: ERROR, reason: 'http_error' }
  if (!body || typeof body !== 'object') return { status: ERROR, reason: 'bad_json' }
  if (body.status !== 1) return { status: ERROR, reason: 'upstream_status' }

  const exists = body.data?.exists
  if (exists === true) return { status: VERIFIED }
  if (exists === false) return { status: NOT_FOUND }
  return { status: ERROR, reason: 'unexpected_shape' }
}
