import 'server-only'

import { studentCheckConfig } from '@/lib/config/env'
import { logger } from '@/lib/logger'
import { ERROR, interpretResponse, NOT_FOUND, VERIFIED } from './student-verification.logic'

/**
 * University Student verification (public /register, Atlas Student only).
 *
 * The upstream check at ATLAS SkillTech requires an `X-App-Key`, so it is called
 * ONLY from the server and the key never leaves this process. Both the browser
 * (via POST /api/landing/student-verification, for the as-you-go UX) and the
 * final registration submit (the authoritative gate) go through here, so a
 * student is verified the same way whichever path runs.
 *
 * The real response contract, confirmed against the UAT endpoint:
 *
 *   exists:    HTTP 200  {"status":1,"msg":"success","data":{"app_id":"…","exists":true}}
 *   not found: HTTP 200  {"status":1,"msg":"success","data":{"app_id":"…","exists":false}}
 *   bad input: HTTP 400  {"status":0,"msg":"app_id is required"}
 *   bad key:   HTTP 401  {"status":0,"msg":"Unauthorized"}
 *
 * The authoritative signal is therefore `data.exists === true`, and ONLY when
 * the HTTP response is ok and `status === 1`. Everything else — a non-200, a
 * `status` other than 1, a missing/non-boolean `exists`, malformed JSON, a
 * timeout or a network error — is treated as a verification FAILURE that must
 * not let the student through, but that the caller may retry. A 200 is never
 * taken as proof on its own. The pure interpretation lives in
 * `./student-verification.logic` so it can be unit tested without a network.
 */

export { VERIFIED, NOT_FOUND, ERROR, interpretResponse }

/**
 * Verify one Student Application ID against the university.
 *
 * @param {string} applicationId
 * @returns {Promise<{ status: VerificationStatus, reason?: string }>}
 */
export async function verifyApplicationId(applicationId) {
  const id = typeof applicationId === 'string' ? applicationId.trim() : ''
  if (!id) return { status: NOT_FOUND, reason: 'empty' }

  // No key configured → we cannot verify, so we refuse rather than pass. The
  // placeholder UAT key works today; production must set its own value.
  if (!studentCheckConfig.apiKey) {
    logger.error('STUDENT_CHECK_API_KEY is not configured; student verification fails closed')
    return { status: ERROR, reason: 'not_configured' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), studentCheckConfig.timeoutMs)

  let response
  try {
    response = await fetch(studentCheckConfig.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Key': studentCheckConfig.apiKey,
      },
      body: JSON.stringify({ app_id: id }),
      signal: controller.signal,
      cache: 'no-store',
    })
  } catch (error) {
    // AbortError (timeout) or a network failure — both unreachable, both retryable.
    logger.warn('student verification upstream unreachable', { name: error?.name ?? 'Error' })
    return { status: ERROR, reason: error?.name === 'AbortError' ? 'timeout' : 'unreachable' }
  } finally {
    clearTimeout(timer)
  }

  let body = null
  try {
    body = await response.json()
  } catch {
    body = null
  }

  const result = interpretResponse({ httpOk: response.ok, body })
  if (result.status === ERROR) {
    logger.warn('student verification did not confirm', { http: response.status, reason: result.reason })
  }
  return result
}
