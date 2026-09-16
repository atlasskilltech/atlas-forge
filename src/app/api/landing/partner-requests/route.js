import { created, readJson, route } from '@/lib/api/respond'
import { landingService, rateLimitService } from '@/lib/services'

/**
 * POST /api/landing/partner-requests
 *   { name, email, phone, company, message? }
 *
 * The "Partner With ATLAS Forge" modal on `/`. Public for the same reason, and
 * with the same replacements for a session, as the service-request route.
 *
 * Reference: /reference/landing-page/Partner with us.png
 */
export const POST = route(async (request) => {
  const result = await landingService.submitPartnerRequest(await readJson(request), {
    sourceIp: rateLimitService.clientAddress(request),
    userAgent: request.headers.get('user-agent'),
  })

  return created(result)
})
