import { ok, readJson, route } from '@/lib/api/respond'
import { assertWithinRequestLimit } from '@/lib/api/ip-rate-limit'
import { AppError, ValidationError } from '@/lib/errors'
import { rateLimitService, studentVerificationService } from '@/lib/services'

/**
 * POST /api/landing/student-verification
 *   { applicationId }  →  { status: 'verified' | 'not_found' }
 *
 * The browser's verification step on the public `/register` page: it lets the
 * Atlas Student flow gate the rest of the form on a real university check
 * WITHOUT the upstream `X-App-Key` ever reaching the browser — the key lives in
 * `STUDENT_CHECK_API_KEY` and is used only by the server-side service.
 *
 * This endpoint is a convenience for the UI, NOT the security boundary: the
 * registration submit re-verifies server-side, so a client that skips or fakes
 * this call still cannot register an unverified ID.
 *
 * Outcomes:
 *   verified   → 200 { status: 'verified' }
 *   not_found  → 200 { status: 'not_found' }   (definitive; no retry)
 *   can't tell → 502 VERIFICATION_UNAVAILABLE  (fail closed; client may retry)
 *
 * Same per-IP rate limit as the other public landing endpoints, so it cannot be
 * used to hammer the university API.
 */
export const POST = route(async (request) => {
  assertWithinRequestLimit(rateLimitService.clientAddress(request))

  const { applicationId } = await readJson(request)
  const id = typeof applicationId === 'string' ? applicationId.trim() : ''

  if (!id) {
    throw new ValidationError('Enter your Student Application ID.', {
      fields: { applicationId: 'Student Application ID is required.' },
    })
  }
  if (id.length > 64) {
    throw new ValidationError('That Student Application ID is too long.', {
      fields: { applicationId: 'Student Application ID must be 64 characters or fewer.' },
    })
  }

  const result = await studentVerificationService.verifyApplicationId(id)

  if (result.status === studentVerificationService.VERIFIED) return ok({ status: 'verified' })
  if (result.status === studentVerificationService.NOT_FOUND) return ok({ status: 'not_found' })

  // Fail closed. The internal reason is logged in the service, never returned.
  throw new AppError('We could not verify your Student Application ID right now. Please try again.', {
    status: 502,
    code: 'VERIFICATION_UNAVAILABLE',
  })
})
