import { AppError } from '@/lib/errors'
import { created, ok, route } from '@/lib/api/respond'
import { outsiderIncubationService, rateLimitService } from '@/lib/services'
import { MAX_IMAGE_BYTES } from '@/lib/storage/uploads'
import { MAX_BODY_BYTES } from '@/lib/validate'

/**
 * The public "Apply for incubation" form on `/`.
 *
 * Deliberately NOT guarded by `requireRole`/`requirePermission`: the people
 * who fill this in have no account. It is also entirely separate from the
 * signed-in Founder endpoints (`/api/founder/startup`, `/api/founder/startup/logo`),
 * which keep `requireRole('founder')`.
 *
 * A submission writes ONE row to `outsider_incubation_applications` and
 * nothing else. The protections that replace a session are the service
 * layer's field rules, its pending-application guard and per-address
 * throttle, the image signature check in `storeImage`, and the same-origin
 * check `route()` applies to every mutation.
 */

/** GET /api/landing/incubation-applications — industries, stages, readiness copy, logo rules. */
export const GET = route(async () => ok(await outsiderIncubationService.getFormOptions()))

/** The logo plus every text field at its limit, with room for multipart framing. */
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + MAX_BODY_BYTES

/**
 * POST /api/landing/incubation-applications — multipart/form-data
 *   fullName, email, phone, startupName, tagline?, problemStatement?,
 *   industrySlug, stageSlug, pitchDeck, productDemo?, productAssets?,
 *   keyPersonnel, logo? (PNG / JPG / WebP file)
 *
 * Multipart rather than JSON because the logo travels with the application:
 * there is no separate anonymous upload endpoint, so no file reaches the disk
 * unless the application it belongs to passed validation.
 */
export const POST = route(async (request) => {
  // Refused before the body is read — parsing it is the expensive part.
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (declared > MAX_REQUEST_BYTES) {
    throw new AppError('The application is too large. The logo limit is 2MB.', {
      status: 413,
      code: 'PAYLOAD_TOO_LARGE',
    })
  }

  let form
  try {
    form = await request.formData()
  } catch {
    throw new AppError('The application could not be read. Please try again.', {
      status: 400,
      code: 'BAD_REQUEST',
    })
  }

  // Text fields only; a File smuggled into one of these is rejected by the
  // validator as "must be text" rather than coerced.
  const text = (name) => form.get(name) ?? undefined
  const input = {
    fullName: text('fullName'),
    email: text('email'),
    phone: text('phone'),
    startupName: text('startupName'),
    tagline: text('tagline'),
    problemStatement: text('problemStatement'),
    industrySlug: text('industrySlug'),
    stageSlug: text('stageSlug'),
    pitchDeck: text('pitchDeck'),
    productDemo: text('productDemo'),
    productAssets: text('productAssets'),
    keyPersonnel: text('keyPersonnel'),
  }

  const logo = form.get('logo')

  const result = await outsiderIncubationService.submit(input, logo === '' ? null : logo, {
    sourceIp: rateLimitService.clientAddress(request),
    userAgent: request.headers.get('user-agent'),
  })

  return created(result)
})
