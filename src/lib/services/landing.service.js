import 'server-only'

import { SERVICE_VALUES } from '@/config/landing'
import { ConflictError, TooManyRequestsError } from '@/lib/errors'
import * as landing from '@/lib/repositories/landing.repository'
import { validator } from '@/lib/validate'

/**
 * The two public forms on the landing page.
 *
 * Unlike every other service here, these accept input from someone with no
 * account and no session. Nothing downstream can fall back on "a signed-in
 * user typed this", so all of the checking happens in this file:
 *
 *   1. shape and length, per field, collected into one 422;
 *   2. a duplicate guard, so a double-clicked Submit or an impatient
 *      resubmission does not create two rows;
 *   3. a per-address throttle, so one client cannot fill the table.
 *
 * The browser does its own checking too, for the red-underline-as-you-type
 * experience — but that is a convenience, not a control. A request that skips
 * the page entirely meets exactly the same rules here.
 */

/*
 * The allowed `serviceRequired` values live in `@/config/landing`, which the
 * form component imports too. One definition, so the page can never offer an
 * option this file would reject.
 */

/* -------------------------------------------------------------------------- */
/* Field rules                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Deliberately permissive, and deliberately not RFC 5322.
 *
 * A regex strict enough to reject every invalid address also rejects valid
 * ones, and the cost of the two mistakes is not symmetric: a wrongly rejected
 * enquiry is a lost enquiry, while a wrongly accepted one is a bounced reply.
 * This catches the typos that actually happen — no `@`, no dot in the domain,
 * a stray space — and leaves the rest to the reply.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

/**
 * Phone numbers arrive as people write them: `+91 98765 43210`,
 * `098765-43210`, `(022) 1234 5678`. Formatting is stored as typed — it is
 * what the person will recognise when they are called back — and only the
 * digit count is checked, against the shortest and longest national numbers
 * in use (7 to 15, per ITU-T E.164).
 */
const PHONE_ALLOWED = /^[0-9+()\-.\s]+$/

function checkContactFields(check, input) {
  const name = check.text('name', input.name, {
    required: true,
    min: 2,
    max: 120,
    label: 'Name',
  })

  const email = check.text('email', input.email, {
    required: true,
    max: 190,
    label: 'Email',
  })
  if (email !== undefined && !EMAIL_PATTERN.test(email)) {
    check.reject('email', 'Enter a valid email address.')
  }

  const phone = check.text('phone', input.phone, {
    required: true,
    max: 32,
    label: 'Phone number',
  })
  if (phone !== undefined) {
    if (!PHONE_ALLOWED.test(phone)) {
      check.reject('phone', 'Use digits, spaces and + ( ) - only.')
    } else {
      const digits = phone.replace(/\D/g, '').length
      if (digits < 7 || digits > 15) {
        check.reject('phone', 'Enter a valid phone number.')
      }
    }
  }

  // Normalised for storage and for the duplicate check, so `A@x.com` and
  // `a@x.com` are recognised as the same person rather than as two enquiries.
  return { name, email: email?.toLowerCase(), phone }
}

/* -------------------------------------------------------------------------- */
/* Anti-flood                                                                 */
/* -------------------------------------------------------------------------- */

/** One person, one form, one submission per this many seconds. */
const DUPLICATE_WINDOW_SECONDS = 10 * 60

/** Everything from one address across this window... */
const THROTTLE_WINDOW_SECONDS = 60 * 60
/** ...is capped here. Generous: an office behind one NAT address is normal. */
const THROTTLE_MAX = 10

/**
 * The two guards, in the order that gives the better message.
 *
 * The duplicate check runs first because "we already have your request" is a
 * reassurance, and a user who double-clicked should see that rather than
 * being told they have been rate limited.
 */
async function assertNotFlooding({ email, sourceIp, countByEmail, countByIp }) {
  if (await countByEmail(email, DUPLICATE_WINDOW_SECONDS).then((n) => n > 0)) {
    throw new ConflictError(
      'We have already received a request from this email address. Our team will be in touch shortly.'
    )
  }

  if (!sourceIp) return
  if ((await countByIp(sourceIp, THROTTLE_WINDOW_SECONDS)) >= THROTTLE_MAX) {
    throw new TooManyRequestsError(
      'Too many requests from this network. Please try again later.',
      THROTTLE_WINDOW_SECONDS
    )
  }
}

/** The UA string is context for triage, not data — truncated to its column. */
const trimUserAgent = (value) => (value ? String(value).slice(0, 255) : null)

/* -------------------------------------------------------------------------- */
/* Submissions                                                                */
/* -------------------------------------------------------------------------- */

/**
 * "How can we Help You?" — Reference: /reference/landing-page/services.png
 *
 * @returns {Promise<{id:number}>} The new row's id, so the client has
 *   something to quote if they call about the enquiry.
 */
export async function submitServiceRequest(input = {}, { sourceIp = '', userAgent = null } = {}) {
  const check = validator()

  const { name, email, phone } = checkContactFields(check, input)

  const serviceRequired = check.oneOf('serviceRequired', input.serviceRequired, SERVICE_VALUES, {
    required: true,
    label: 'Service required',
  })

  const message = check.text('message', input.message, {
    max: 2000,
    label: 'Tell us more',
  })

  check.throwIfInvalid()

  await assertNotFlooding({
    email,
    sourceIp,
    countByEmail: landing.countRecentServiceByEmail,
    countByIp: landing.countRecentServiceByIp,
  })

  const id = await landing.createServiceRequest({
    name,
    email,
    phone,
    serviceRequired,
    message: message ?? null,
    sourceIp,
    userAgent: trimUserAgent(userAgent),
  })

  return { id }
}

/**
 * "Partner With ATLAS Forge" —
 * Reference: /reference/landing-page/Partner with us.png
 */
export async function submitPartnerRequest(input = {}, { sourceIp = '', userAgent = null } = {}) {
  const check = validator()

  const { name, email, phone } = checkContactFields(check, input)

  const company = check.text('company', input.company, {
    required: true,
    min: 2,
    max: 160,
    label: 'Company',
  })

  const message = check.text('message', input.message, {
    max: 2000,
    label: 'Message',
  })

  check.throwIfInvalid()

  await assertNotFlooding({
    email,
    sourceIp,
    countByEmail: landing.countRecentPartnerByEmail,
    countByIp: landing.countRecentPartnerByIp,
  })

  const id = await landing.createPartnerRequest({
    name,
    email,
    phone,
    company,
    message: message ?? null,
    sourceIp,
    userAgent: trimUserAgent(userAgent),
  })

  return { id }
}
