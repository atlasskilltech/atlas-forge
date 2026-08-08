import 'server-only'

import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { sessionConfig, isProduction } from '@/lib/config/env'

/**
 * The signed session cookie.
 *
 * The cookie carries only an opaque, signed reference to the user — the user
 * id, the role they are acting as, and an expiry. It never carries a name,
 * email, permission list or anything else the client could act on. Every
 * request rebuilds the real identity from the database, so revoking a role or
 * deactivating an account takes effect on the next request rather than
 * whenever a stale cookie happens to expire.
 *
 * Format:  base64url(payload JSON) "." base64url(HMAC-SHA256)
 *
 * The signature is verified with a constant-time comparison, so a caller
 * cannot discover a valid signature byte by byte from response timings.
 */

const b64 = (buffer) => Buffer.from(buffer).toString('base64url')

function sign(encodedPayload) {
  return createHmac('sha256', sessionConfig.secret).update(encodedPayload).digest('base64url')
}

/** Serialise and sign. Returns the cookie value. */
export function seal({ userId, role }) {
  const nowSeconds = Math.floor(Date.now() / 1000)
  const payload = {
    uid: userId,
    role: role ?? null,
    iat: nowSeconds,
    exp: nowSeconds + sessionConfig.ttlSeconds,
  }
  const encoded = b64(JSON.stringify(payload))
  return `${encoded}.${sign(encoded)}`
}

/**
 * Verify and parse a cookie value.
 * Returns `null` for anything malformed, mis-signed or expired — callers never
 * have to distinguish the failure modes, and neither should an attacker.
 */
export function unseal(value) {
  if (typeof value !== 'string') return null

  const separator = value.lastIndexOf('.')
  if (separator <= 0) return null

  const encoded = value.slice(0, separator)
  const signature = value.slice(separator + 1)

  const expected = Buffer.from(sign(encoded))
  const received = Buffer.from(signature)
  if (expected.length !== received.length) return null
  if (!timingSafeEqual(expected, received)) return null

  let payload
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'))
  } catch {
    return null
  }

  if (typeof payload?.uid !== 'number' || typeof payload?.exp !== 'number') return null
  if (payload.exp * 1000 <= Date.now()) return null

  return { userId: payload.uid, role: payload.role ?? null, expiresAt: payload.exp }
}

const COOKIE_OPTIONS = {
  httpOnly: true, // unreadable from JavaScript, so XSS cannot exfiltrate it
  sameSite: 'lax', // blocks cross-site POSTs while keeping normal navigation
  secure: isProduction, // plain HTTP is normal for local XAMPP development
  path: '/',
}

/** Read the current session from the request cookies, or `null`. */
export async function readSession() {
  const store = await cookies()
  return unseal(store.get(sessionConfig.cookieName)?.value)
}

/** Write the session cookie. Only a Route Handler or Server Action may call this. */
export async function writeSession({ userId, role }) {
  const store = await cookies()
  store.set(sessionConfig.cookieName, seal({ userId, role }), {
    ...COOKIE_OPTIONS,
    maxAge: sessionConfig.ttlSeconds,
  })
}

/** Clear the session cookie. */
export async function clearSession() {
  const store = await cookies()
  store.set(sessionConfig.cookieName, '', { ...COOKIE_OPTIONS, maxAge: 0 })
}
