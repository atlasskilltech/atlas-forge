import { NextResponse } from 'next/server'
import { resolveSessionCookieName } from '@/lib/auth/cookie-name'

/**
 * Sends anonymous visitors to the login screen before a protected page renders.
 *
 * (Next 16 renamed this file convention from `middleware` to `proxy`; it is the
 * same request hook, running before the route is matched.)
 *
 * This exists for the response, not for the security. The app streams its
 * pages, so by the time a Server Component's guard calls `redirect()` the
 * headers have already been flushed and Next can only fall back to a
 * meta-refresh inside a 200. Checking here — before rendering starts — gives a
 * real 307 with a `Location`, which is what a browser, a crawler and an HTTP
 * client all expect.
 *
 * Authorisation still belongs to the page and route guards: this only looks at
 * whether a session cookie is present, never at what it claims. A forged or
 * expired cookie gets past this check and is then rejected by
 * `requireRoleOrRedirect`, which verifies the signature and re-reads the user's
 * roles from the database on every request. This hook has no database access,
 * so it deliberately does not try to make that decision.
 */

/**
 * Resolved through the shared helper rather than read from the environment
 * here: production prefixes the cookie with `__Host-`, and a proxy looking for
 * the unprefixed name would redirect every signed-in user back to /login.
 */
const COOKIE_NAME = resolveSessionCookieName()

export function proxy(request) {
  if (request.cookies.has(COOKIE_NAME)) return NextResponse.next()

  const { pathname, search } = request.nextUrl
  const login = new URL('/login', request.url)
  login.searchParams.set('next', `${pathname}${search}`)

  return NextResponse.redirect(login, 307)
}

export const config = {
  /** Every authenticated area. All five modules now read from MySQL. */
  matcher: ['/student/:path*', '/founder/:path*', '/forge/:path*', '/backend/:path*', '/admin/:path*'],
}
