import { randomBytes } from 'node:crypto'
import { NextResponse } from 'next/server'
import { googleAuthConfig, isProduction } from '@/lib/config/env'
import { buildAuthUrl, isEnabled } from '@/lib/services/google-auth.service'

/**
 * GET /api/auth/google/start
 *
 * Begins the Google Authorization Code flow. We mint a random `state` (CSRF)
 * and `nonce` (replay), stash them — plus any same-site `next` — in short-lived
 * httpOnly cookies, then redirect the browser to Google's consent screen. The
 * matching callback verifies both before issuing a session.
 *
 * Reachable while anonymous by design: it runs before any session exists, and
 * the proxy matcher does not cover `/api`. It is deliberately NOT wrapped in
 * `route()` — it returns a redirect, not the JSON envelope — so it sets cookies
 * directly on the `NextResponse` it returns.
 */

const TEMP_COOKIE_MAX_AGE = 600 // 10 minutes — the lifetime of one sign-in attempt

/** Options shared by the three short-lived OAuth round-trip cookies. */
function tempCookieOptions() {
  return {
    httpOnly: true, // unreadable from JavaScript
    sameSite: 'lax', // survives the top-level GET redirect back from Google
    secure: isProduction, // plain HTTP is normal for local XAMPP development
    path: '/',
    maxAge: TEMP_COOKIE_MAX_AGE,
  }
}

/** Keep `next` only when it is a path on this site, never an external URL. */
function sanitizeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null
}

export async function GET(request) {
  const loginUrl = new URL('/login', googleAuthConfig.origin)

  if (!isEnabled()) {
    loginUrl.searchParams.set('error', 'google_unavailable')
    return NextResponse.redirect(loginUrl)
  }

  const state = randomBytes(32).toString('base64url')
  const nonce = randomBytes(32).toString('base64url')
  const next = sanitizeNext(new URL(request.url).searchParams.get('next'))

  let authUrl
  try {
    authUrl = buildAuthUrl({ state, nonce })
  } catch {
    loginUrl.searchParams.set('error', 'google_failed')
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.redirect(authUrl)
  response.cookies.set('g_oauth_state', state, tempCookieOptions())
  response.cookies.set('g_oauth_nonce', nonce, tempCookieOptions())
  // Always write `next` (empty when absent) so a value left over from a previous
  // attempt can never be read on this one.
  response.cookies.set('g_oauth_next', next ?? '', tempCookieOptions())
  return response
}
