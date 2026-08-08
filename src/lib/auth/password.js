import 'server-only'

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

/**
 * Password hashing with scrypt from Node's standard library.
 *
 * scrypt is memory-hard and purpose-built for passwords, and it ships with
 * Node — no native module to rebuild per platform, which matters for a
 * deployment that must run unchanged anywhere.
 *
 * Stored format: `scrypt$N$r$p$<salt-hex>$<hash-hex>`
 * The parameters travel with the hash so they can be raised later without
 * invalidating existing passwords.
 */

const PARAMS = { N: 16384, r: 8, p: 1, keyLength: 64, saltBytes: 16 }

export async function hashPassword(plain) {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('Password must be a non-empty string.')
  }
  const salt = randomBytes(PARAMS.saltBytes)
  const derived = await scrypt(plain, salt, PARAMS.keyLength, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
  })
  return [
    'scrypt',
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString('hex'),
    derived.toString('hex'),
  ].join('$')
}

/**
 * Constant-time verification. Returns false for malformed hashes rather than
 * throwing, so a corrupt row cannot be distinguished from a wrong password.
 */
export async function verifyPassword(plain, stored) {
  if (typeof plain !== 'string' || typeof stored !== 'string') return false

  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, N, r, p, saltHex, hashHex] = parts
  try {
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const derived = await scrypt(plain, salt, expected.length, {
      N: Number(N),
      r: Number(r),
      p: Number(p),
    })
    return timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/** True when a stored hash used weaker parameters and should be re-hashed on login. */
export function needsRehash(stored) {
  const parts = String(stored ?? '').split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return true
  return Number(parts[1]) < PARAMS.N || Number(parts[2]) < PARAMS.r
}
