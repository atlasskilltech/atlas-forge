import { ok, route } from '@/lib/api/respond'
import { clearSession } from '@/lib/auth/session'

/** POST /api/auth/logout — clears the session cookie. */
export const POST = route(async () => {
  await clearSession()
  return ok({ signedOut: true })
})
