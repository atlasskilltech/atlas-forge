import { NextResponse } from 'next/server'
import { googleAuthConfig, isProduction } from '@/lib/config/env'
import { writeSession } from '@/lib/auth/session'
import {
  GoogleAuthError,
  resolveEligibleUser,
  verifyCallback,
} from '@/lib/services/google-auth.service'

/**
 * GET /api/auth/google/callback
 *
 * Google redirects here with `code` + `state` (or `error` if the user declined).
 * We check the CSRF state against the cookie we set at `/start`, verify and
 * decode the ID token, resolve the Google-verified email to an existing active
 * account, then issue the SAME session cookie the password path issues
 * (`writeSession`). Any failure becomes a safe `/login?error=<code>` redirect —
 * never a token detail, stack or the client secret.
 *
 * `must_change_password` is unchanged: the session is issued here, and the guard
 * sends a flagged user to `/change-password` on their first protected request,
 * exactly as after a password login.
 */

const OAUTH_COOKIES = ['g_oauth_state', 'g_oauth_nonce', 'g_oauth_next']

/** Expire the three OAuth round-trip cookies on the response. */
function clearTemp(response) {
  for (const name of OAUTH_COOKIES) {
    response.cookies.set(name, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 0,
    })
  }
  return response
}

function sanitizeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null
}

function redirectToLogin(errorCode) {
  const url = new URL('/login', googleAuthConfig.origin)
  url.searchParams.set('error', errorCode)
  return clearTemp(NextResponse.redirect(url))
}

export async function GET(request) {
  const params = new URL(request.url).searchParams

  // The user cancelled, or Google declined (e.g. error=access_denied).
  if (params.get('error')) return redirectToLogin('google_cancelled')

  const code = params.get('code')
  const state = params.get('state')
  const cookieState = request.cookies.get('g_oauth_state')?.value
  const nonce = request.cookies.get('g_oauth_nonce')?.value
  const next = sanitizeNext(request.cookies.get('g_oauth_next')?.value)

  // CSRF: the state Google echoes back must match the one we set at /start.
  if (!state || !cookieState || state !== cookieState) {
    return redirectToLogin('google_state')
  }

  let identity
  try {
    const { email } = await verifyCallback({ code, expectedNonce: nonce })
    identity = await resolveEligibleUser(email)
  } catch (error) {
    const reason = error instanceof GoogleAuthError ? error.reason : 'google_failed'
    return redirectToLogin(reason)
  }

  // The exact call password login uses. `cookies().set` inside writeSession is
  // merged by Next into the redirect response below, alongside the temp-cookie
  // clearing — both Set-Cookie headers are emitted.
  await writeSession({
    userId: identity.user.id,
    role: identity.defaultRole?.slug ?? null,
  })

  // Same destination as password login; multi-role users still pass through
  // /select-role, and a forced-password-change user is redirected on from there.
  const destination = new URL(next ?? '/select-role', googleAuthConfig.origin)
  return clearTemp(NextResponse.redirect(destination))
}
