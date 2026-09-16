import { created, readJson, route } from '@/lib/api/respond'
import { landingService, rateLimitService } from '@/lib/services'

/**
 * POST /api/landing/service-requests
 *   { name, email, phone, serviceRequired, message? }
 *
 * The "How can we Help You?" modal on `/`.
 *
 * Deliberately NOT guarded by `requireRole`/`requirePermission`: the whole
 * point of the landing page is that someone with no account can reach it. The
 * protections that replace a session are the service layer's field rules, its
 * duplicate guard and its per-address throttle, plus the same-origin check
 * that `route()` already applies to every mutation.
 *
 * Reference: /reference/landing-page/services.png
 */
export const POST = route(async (request) => {
  const result = await landingService.submitServiceRequest(await readJson(request), {
    sourceIp: rateLimitService.clientAddress(request),
    userAgent: request.headers.get('user-agent'),
  })

  return created(result)
})
