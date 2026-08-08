/**
 * The session cookie's name, resolved identically everywhere.
 *
 * This module is deliberately NOT marked `server-only`: the proxy runs in a
 * separate, restricted runtime and cannot import `@/lib/config/env`, but it
 * must look for exactly the cookie the session writer set. Keeping the one
 * rule here means the two can never drift apart — a mismatch would send every
 * signed-in user back to the login screen.
 *
 * In production the name gains the `__Host-` prefix, which makes the browser
 * refuse the cookie unless it is Secure, Path=/ and carries no Domain. That
 * closes off cookie fixation from a sibling subdomain: `evil.example.edu`
 * cannot plant a session for `forge.example.edu`. The session writer already
 * sets exactly those attributes, so the prefix costs nothing.
 *
 * Development stays unprefixed because `__Host-` also requires HTTPS, and
 * local XAMPP is served over plain HTTP.
 */
export function resolveSessionCookieName(env = process.env) {
  const base = env.SESSION_COOKIE_NAME || 'atlas_forge_session'
  if (env.NODE_ENV !== 'production') return base
  return base.startsWith('__Host-') ? base : `__Host-${base}`
}
