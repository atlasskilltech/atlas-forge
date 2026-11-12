import 'server-only'

import { OAuth2Client } from 'google-auth-library'
import { AppError } from '@/lib/errors'
import { googleAuthConfig } from '@/lib/config/env'
import * as auth from '@/lib/services/auth.service'
import * as users from '@/lib/repositories/users.repository'

/**
 * Google Sign-In — token verification and account resolution.
 *
 * This layer never touches cookies or headers (the route handler owns the
 * session, exactly as with password login). It turns an OAuth authorization
 * code into a Google-verified email, then resolves that email to an EXISTING,
 * ACTIVE ATLAS Forge account.
 *
 * It never creates an account and never bypasses registration approval: a
 * registration that was never approved has no `users` row, so it simply does
 * not resolve and the caller is told there is no account.
 */

const GOOGLE_ISSUERS = new Set(['https://accounts.google.com', 'accounts.google.com'])

/**
 * A Google Sign-In failure the callback maps to a safe `?error=<reason>` code.
 * `reason` is an opaque slug — never a message carrying token internals. It
 * extends `AppError` only so that if one ever escaped into the JSON responder it
 * would surface as a clean 401 rather than a 500; the callback handles these
 * itself and redirects.
 */
export class GoogleAuthError extends AppError {
  constructor(reason, message = 'Google sign-in could not be completed.') {
    super(message, { status: 401, code: 'GOOGLE_AUTH_FAILED' })
    this.reason = reason
  }
}

/** True only when both the client id and secret are configured. */
export function isEnabled() {
  return googleAuthConfig.enabled
}

function client() {
  return new OAuth2Client({
    clientId: googleAuthConfig.clientId,
    clientSecret: googleAuthConfig.clientSecret,
    redirectUri: googleAuthConfig.redirectUri,
  })
}

/**
 * The Google consent URL to send the browser to. `state` guards against CSRF
 * and `nonce` against replay; both are echoed back and checked on the callback.
 */
export function buildAuthUrl({ state, nonce }) {
  return client().generateAuthUrl({
    scope: ['openid', 'email', 'profile'],
    state,
    nonce,
    // Let the user pick which Google account rather than silently reusing one.
    prompt: 'select_account',
    // No refresh token wanted — this is a sign-in, not an ongoing API grant.
    access_type: 'online',
  })
}

/**
 * Exchange the authorization code for tokens and FULLY verify the resulting ID
 * token: signature (against Google's live certs), audience (our client id),
 * issuer, expiry — all via `verifyIdToken` — plus the `nonce` we issued and a
 * Google-verified email. Returns the verified email (and sub/name for logging).
 *
 * Every failure is collapsed to a `GoogleAuthError` with a neutral reason so no
 * token detail, signature state or client secret can leak to the caller.
 */
export async function verifyCallback({ code, expectedNonce }) {
  if (!code) throw new GoogleAuthError('google_failed')

  const oauth = client()

  let idToken
  try {
    const { tokens } = await oauth.getToken(code)
    idToken = tokens?.id_token
  } catch {
    throw new GoogleAuthError('google_failed')
  }
  if (!idToken) throw new GoogleAuthError('google_failed')

  let payload
  try {
    const ticket = await oauth.verifyIdToken({ idToken, audience: googleAuthConfig.clientId })
    payload = ticket.getPayload()
  } catch {
    // Bad signature, wrong audience or an expired token all land here.
    throw new GoogleAuthError('google_failed')
  }

  if (!payload || !GOOGLE_ISSUERS.has(payload.iss)) throw new GoogleAuthError('google_failed')
  if (!expectedNonce || payload.nonce !== expectedNonce) throw new GoogleAuthError('google_failed')
  if (payload.email_verified !== true || !payload.email) {
    throw new GoogleAuthError('google_unverified')
  }

  return { email: payload.email, sub: payload.sub, name: payload.name ?? null }
}

/**
 * Resolve a Google-verified email to an eligible ATLAS Forge identity, applying
 * the same gate the password path applies: the account must exist, not be
 * soft-deleted (the query enforces that), and be `active`. Returns the full
 * identity (user + roles + permissions + defaultRole) via `buildIdentity`.
 */
export async function resolveEligibleUser(email) {
  const user = await users.findByEmail(email)
  if (!user) throw new GoogleAuthError('google_no_account')
  if (user.status !== 'active') throw new GoogleAuthError('google_inactive')
  return auth.buildIdentity(user.id)
}
