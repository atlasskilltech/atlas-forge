import { created, readJson, route } from '@/lib/api/respond'
import { rateLimitService, registrationService } from '@/lib/services'

/**
 * POST /api/landing/registrations
 *   { fullName, email, phone?, roleCategory, consent, ...role-specific fields }
 *
 * The public "Join the ATLAS Forge Network" page (`/register`).
 *
 * Deliberately NOT guarded by `requireRole`/`requirePermission`: the whole
 * point of a public registration is that someone with no account can reach it.
 * The protections that replace a session are the service layer's per-role field
 * rules, its duplicate guard and its per-address throttle, plus the same-origin
 * check that `route()` already applies to every mutation.
 *
 * A successful submit creates ONE `registration_requests` row with
 * status 'pending'. No account, role or access is granted here — a Forge
 * Manager reviews the request first.
 *
 * Reference: /reference/form/
 */
export const POST = route(async (request) => {
  const result = await registrationService.submit(await readJson(request), {
    sourceIp: rateLimitService.clientAddress(request),
    userAgent: request.headers.get('user-agent'),
  })

  return created(result)
})
