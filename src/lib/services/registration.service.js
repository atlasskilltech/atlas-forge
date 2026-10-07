import 'server-only'

import { randomBytes } from 'node:crypto'
import {
  ANGEL_NETWORKS_VALUES,
  CONDUCT_SESSION_VALUES,
  GRADUATION_YEAR_VALUES,
  INCUBATION_SUPPORT_NEEDS_VALUES,
  INVEST_SECTORS_VALUES,
  LOOKING_FOR_INCUBATION_VALUES,
  MENTORSHIP_AREAS_VALUES,
  OPEN_TO_INVESTING_VALUES,
  PREFERRED_AUDIENCE_VALUES,
  REGISTRATION_LIMITS,
  REGISTRATION_ROLE_VALUES,
  SCHOOL_VALUES,
  SEEKING_MENTORSHIP_VALUES,
  SESSION_TYPES_VALUES,
  TYPE_OF_SUPPORT_VALUES,
  WILLING_TO_MENTOR_VALUES,
} from '@/config/registration'
import { execute, transaction } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import * as registrationEmails from '@/lib/email/registration-emails'
import { ConflictError, NotFoundError, TooManyRequestsError } from '@/lib/errors'
import * as lookups from '@/lib/repositories/lookups.repository'
import * as platform from '@/lib/repositories/platform.repository'
import * as registration from '@/lib/repositories/registration.repository'
import * as users from '@/lib/repositories/users.repository'
import { validator } from '@/lib/validate'

/** Approved registrants receive this role and only this role. */
const NETWORK_MEMBER_ROLE = 'network-member'

/** The sign-in URL emailed to applicants, from the configured public site URL. */
const loginUrl = () =>
  `${(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, '')}/login`

/**
 * The public "Join the ATLAS Forge Network" registration.
 *
 * Like the landing enquiries, this accepts input from someone with no account
 * and no session, so every check lives here rather than leaning on "a signed-in
 * user typed this":
 *
 *   1. shape and length, per field and per role, collected into one 422;
 *   2. a duplicate guard, so a double-clicked Submit or a resubmission does not
 *      create two pending rows for the same email;
 *   3. a per-address throttle, so one client cannot fill the table.
 *
 * A successful submit writes ONE row in `registration_requests` with
 * `status = 'pending'` and nothing else: no account, no role, no access. A
 * Forge Manager reviews it later (Phases 5–6). The browser does its own
 * checking for the as-you-type experience, but that is a convenience — a request
 * that skips the page entirely meets exactly the same rules here.
 */

const L = REGISTRATION_LIMITS

/** Permissive, not RFC 5322 — a wrongly rejected registration is a lost one. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const PHONE_ALLOWED = /^[0-9+()\-.\s]+$/
/** A link people actually type: `linkedin.com/in/x`, with or without a scheme. */
const LINK_PATTERN = /^\S+\.\S+$/

/* -------------------------------------------------------------------------- */
/* Small field helpers                                                        */
/* -------------------------------------------------------------------------- */

function checkLink(check, field, value, { required = false, label }) {
  const text = check.text(field, value, { required, max: L.url, label })
  if (text !== undefined && !LINK_PATTERN.test(text)) {
    check.reject(field, `${label} must be a valid link.`)
  }
  return text
}

/** A multi-select: an array whose every entry is one of `allowed`. */
function checkMulti(check, field, raw, allowed, label) {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) {
    check.reject(field, `${label} is not valid.`)
    return []
  }
  const chosen = []
  for (const value of raw) {
    if (typeof value !== 'string' || !allowed.includes(value)) {
      check.reject(field, `${label} contains an option that is not allowed.`)
      return []
    }
    if (!chosen.includes(value)) chosen.push(value)
  }
  return chosen
}

/** Drops undefined/null, empty strings and empty arrays so stored JSON stays lean. */
function prune(details) {
  const out = {}
  for (const [key, value] of Object.entries(details)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (typeof value === 'string' && value === '') continue
    out[key] = value
  }
  return out
}

/* -------------------------------------------------------------------------- */
/* Common fields (every role)                                                 */
/* -------------------------------------------------------------------------- */

function checkCommon(check, input) {
  const fullName = check.text('fullName', input.fullName, {
    required: true,
    min: 2,
    max: L.fullName,
    label: 'Name',
  })

  const email = check.text('email', input.email, { required: true, max: L.email, label: 'Email' })
  if (email !== undefined && !EMAIL_PATTERN.test(email)) {
    check.reject('email', 'Enter a valid email address.')
  }

  const phone = check.text('phone', input.phone, { max: L.phone, label: 'Phone number' })
  if (phone !== undefined) {
    if (!PHONE_ALLOWED.test(phone)) {
      check.reject('phone', 'Use digits, spaces and + ( ) - only.')
    } else {
      const digits = phone.replace(/\D/g, '').length
      if (digits < 7 || digits > 15) check.reject('phone', 'Enter a valid phone number.')
    }
  }

  // Consent is an explicit act, not a stored preference — it must be `true`.
  if (input.consent !== true) {
    check.reject('consent', 'Please agree to the statement before submitting.')
  }

  // Normalised for storage and the duplicate check, so `A@x.com` and `a@x.com`
  // are recognised as the same person.
  return { fullName, email: email?.toLowerCase(), phone: phone ?? null }
}

/* -------------------------------------------------------------------------- */
/* Role sections                                                              */
/* -------------------------------------------------------------------------- */

function checkStudent(check, input) {
  return prune({
    school: check.oneOf('school', input.school, SCHOOL_VALUES, {
      required: true,
      label: 'School',
    }),
    typeOfSupport: checkMulti(
      check,
      'typeOfSupport',
      input.typeOfSupport,
      TYPE_OF_SUPPORT_VALUES,
      'Type of support'
    ),
    portfolioLink: checkLink(check, 'portfolioLink', input.portfolioLink, {
      required: true,
      label: 'Portfolio / work link',
    }),
    message: check.text('message', input.message, { max: L.message, label: 'Message' }),
  })
}

function checkAlumni(check, input) {
  return prune({
    department: check.text('department', input.department, {
      max: L.department,
      label: 'Department',
    }),
    graduationYear: check.oneOf('graduationYear', input.graduationYear, GRADUATION_YEAR_VALUES, {
      required: true,
      label: 'Batch / graduation year',
    }),
    course: check.text('course', input.course, { required: true, max: L.course, label: 'Course' }),
    currentCity: check.text('currentCity', input.currentCity, {
      required: true,
      max: L.currentCity,
      label: 'Current city',
    }),
    currentRoleCompany: check.text('currentRoleCompany', input.currentRoleCompany, {
      required: true,
      max: L.currentRoleCompany,
      label: 'Current role & company',
    }),
    linkedinUrl: checkLink(check, 'linkedinUrl', input.linkedinUrl, {
      label: 'LinkedIn profile URL',
    }),
    industrySector: check.text('industrySector', input.industrySector, {
      required: true,
      max: L.industrySector,
      label: 'Industry / sector',
    }),
    yearsExperience: check.text('yearsExperience', input.yearsExperience, {
      max: L.yearsExperience,
      label: 'Years of professional experience',
    }),
    willingToMentor: check.oneOf('willingToMentor', input.willingToMentor, WILLING_TO_MENTOR_VALUES, {
      required: true,
      label: 'Are you willing to mentor?',
    }),
    seekingMentorship: check.oneOf(
      'seekingMentorship',
      input.seekingMentorship,
      SEEKING_MENTORSHIP_VALUES,
      { label: 'Are you seeking mentorship?' }
    ),
    mentorshipAreas: checkMulti(
      check,
      'mentorshipAreas',
      input.mentorshipAreas,
      MENTORSHIP_AREAS_VALUES,
      'Areas of mentorship interest'
    ),
    conductSession: check.oneOf('conductSession', input.conductSession, CONDUCT_SESSION_VALUES, {
      required: true,
      label: 'Would you like to conduct a session or event?',
    }),
    sessionTypes: checkMulti(
      check,
      'sessionTypes',
      input.sessionTypes,
      SESSION_TYPES_VALUES,
      'What type of session?'
    ),
    preferredAudience: checkMulti(
      check,
      'preferredAudience',
      input.preferredAudience,
      PREFERRED_AUDIENCE_VALUES,
      'Preferred audience'
    ),
    sessionTopics: check.text('sessionTopics', input.sessionTopics, {
      max: L.topics,
      label: 'Session topics',
    }),
    openToInvesting: check.oneOf('openToInvesting', input.openToInvesting, OPEN_TO_INVESTING_VALUES, {
      required: true,
      label: 'Are you open to investing in startups?',
    }),
    lookingForIncubation: check.oneOf(
      'lookingForIncubation',
      input.lookingForIncubation,
      LOOKING_FOR_INCUBATION_VALUES,
      { required: true, label: 'Are you looking for incubation support?' }
    ),
    incubationSupportNeeds: checkMulti(
      check,
      'incubationSupportNeeds',
      input.incubationSupportNeeds,
      INCUBATION_SUPPORT_NEEDS_VALUES,
      'What support do you need?'
    ),
    investSectors: checkMulti(
      check,
      'investSectors',
      input.investSectors,
      INVEST_SECTORS_VALUES,
      'Preferred sectors to invest in'
    ),
    angelNetwork: check.oneOf('angelNetwork', input.angelNetwork, ANGEL_NETWORKS_VALUES, {
      label: 'Are you part of any angel network?',
    }),
    additionalComments: check.text('additionalComments', input.additionalComments, {
      max: L.comments,
      label: 'Additional comments',
    }),
  })
}

function checkFaculty(check, input) {
  return prune({
    department: check.text('department', input.department, {
      required: true,
      max: L.department,
      label: 'Department',
    }),
    designation: check.text('designation', input.designation, {
      required: true,
      max: L.designation,
      label: 'Designation',
    }),
    linkedinUrl: checkLink(check, 'linkedinUrl', input.linkedinUrl, {
      label: 'LinkedIn profile URL',
    }),
    willingToMentor: check.oneOf('willingToMentor', input.willingToMentor, WILLING_TO_MENTOR_VALUES, {
      required: true,
      label: 'Are you willing to mentor?',
    }),
    mentorshipAreas: checkMulti(
      check,
      'mentorshipAreas',
      input.mentorshipAreas,
      MENTORSHIP_AREAS_VALUES,
      'Areas of mentorship interest'
    ),
    conductSession: check.oneOf('conductSession', input.conductSession, CONDUCT_SESSION_VALUES, {
      required: true,
      label: 'Would you like to conduct a session or event?',
    }),
    sessionTypes: checkMulti(
      check,
      'sessionTypes',
      input.sessionTypes,
      SESSION_TYPES_VALUES,
      'What type of session?'
    ),
    preferredAudience: checkMulti(
      check,
      'preferredAudience',
      input.preferredAudience,
      PREFERRED_AUDIENCE_VALUES,
      'Preferred audience'
    ),
    sessionTopics: check.text('sessionTopics', input.sessionTopics, {
      max: L.topics,
      label: 'Session topics',
    }),
  })
}

function checkOthers(check, input) {
  return prune({
    organisation: check.text('organisation', input.organisation, {
      required: true,
      max: L.organisation,
      label: 'Organisation',
    }),
    designation: check.text('designation', input.designation, {
      required: true,
      max: L.designation,
      label: 'Designation',
    }),
    typeOfSupport: checkMulti(
      check,
      'typeOfSupport',
      input.typeOfSupport,
      TYPE_OF_SUPPORT_VALUES,
      'Type of support'
    ),
    portfolioLink: checkLink(check, 'portfolioLink', input.portfolioLink, {
      required: true,
      label: 'Portfolio / work link',
    }),
    message: check.text('message', input.message, { max: L.message, label: 'Message' }),
  })
}

const ROLE_CHECKERS = {
  atlas_student: checkStudent,
  atlas_alumni: checkAlumni,
  atlas_faculty: checkFaculty,
  others: checkOthers,
}

/* -------------------------------------------------------------------------- */
/* Anti-flood                                                                 */
/* -------------------------------------------------------------------------- */

const THROTTLE_WINDOW_SECONDS = 60 * 60
const THROTTLE_MAX = 10

async function assertNotFlooding({ email, sourceIp }) {
  if ((await registration.countPendingByEmail(email)) > 0) {
    throw new ConflictError(
      'We already have a registration pending review for this email address. The ATLAS Forge team will be in touch.'
    )
  }

  if (!sourceIp) return
  if ((await registration.countRecentByIp(sourceIp, THROTTLE_WINDOW_SECONDS)) >= THROTTLE_MAX) {
    throw new TooManyRequestsError(
      'Too many requests from this network. Please try again later.',
      THROTTLE_WINDOW_SECONDS
    )
  }
}

const trimUserAgent = (value) => (value ? String(value).slice(0, 255) : null)

/** Unambiguous characters only — no 0/O or 1/I — so a reference can be read aloud. */
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function newReference() {
  const bytes = randomBytes(6)
  const code = [...bytes]
    .map((byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length])
    .join('')
  return `AFN-${new Date().getFullYear()}-${code}`
}

/* -------------------------------------------------------------------------- */
/* Submission                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * @returns {Promise<{ reference: string }>} The code shown to the applicant.
 */
export async function submit(input = {}, { sourceIp = '', userAgent = null } = {}) {
  const check = validator()

  const { fullName, email, phone } = checkCommon(check, input)
  const roleCategory = check.oneOf('roleCategory', input.roleCategory, REGISTRATION_ROLE_VALUES, {
    required: true,
    label: 'Who are you?',
  })

  // Only validate a role's own section once the role itself is valid.
  const details = roleCategory ? ROLE_CHECKERS[roleCategory](check, input) : {}

  check.throwIfInvalid()

  await assertNotFlooding({ email, sourceIp })

  const row = {
    fullName,
    email,
    phone,
    roleCategory,
    details,
    consent: input.consent === true,
    sourceIp,
    userAgent: trimUserAgent(userAgent),
  }

  // The reference is random, so a collision is possible in principle; the
  // unique key catches it and a fresh code is drawn.
  let reference = null
  for (let attempt = 0; attempt < 5 && !reference; attempt += 1) {
    const candidate = newReference()
    try {
      await registration.create({ ...row, reference: candidate })
      reference = candidate
    } catch (error) {
      if (error?.code !== 'ER_DUP_ENTRY') throw error
    }
  }

  if (!reference) throw new Error('Could not allocate a unique registration reference.')

  // Best-effort confirmation. The row is already committed; a mail failure is
  // logged inside the sender and never fails the public submission.
  await registrationEmails.sendPendingRegistrationEmail({ to: email, fullName, reference })

  return { reference }
}

/* -------------------------------------------------------------------------- */
/* Forge Manager review                                                       */
/* -------------------------------------------------------------------------- */

export const list = (filters) => registration.findAll(filters)
export const getById = (id) => registration.findById(id)

/**
 * Approve a pending registration and bring the person into the platform as a
 * network member.
 *
 * One transaction does everything, so the outcome is all-or-nothing — never an
 * approved row with no account, nor an account with no approved row:
 *
 *   1. claim the row (pending → approved, reviewer + time); a lost race here
 *      means someone already decided it, so the whole thing aborts with 409.
 *   2. create a new user (status 'active', must_change_password = 1, an
 *      `AFM-<year>-<id>` App ID, a scrypt-hashed temporary password) OR, when
 *      the email already belongs to an ACTIVE account, attach to that account
 *      instead of creating a second one.
 *   3. grant the `network-member` role — and ONLY that role.
 *   4. write the user and role ids back onto the registration row.
 *   5. one audit line.
 *
 * The temporary password is returned ONCE (shown in the reviewer's UI until the
 * approval email exists); only its hash is stored. A first sign-in is forced
 * through the password change by `must_change_password`.
 */
export async function approve({ applicationId, actorId }) {
  const application = await registration.findById(applicationId)
  if (!application) throw new NotFoundError('Registration')
  assertPending(application)

  const role = await findRoleBySlug(NETWORK_MEMBER_ROLE)
  if (!role) {
    throw new ConflictError(
      'The network-member role is missing. Apply migration 011 before approving registrations.'
    )
  }

  // Decided before the transaction so an unusable match is reported cleanly
  // rather than surfacing as a duplicate-key failure mid-transaction.
  const existing = await registration.findUserByEmail(application.email)
  if (existing && (existing.isDeleted || existing.status !== 'active')) {
    throw new ConflictError(
      `This email belongs to an account (${existing.appId}) that is not active. Reactivate it or reject this registration.`
    )
  }

  const isNew = !existing
  const temporaryPassword = isNew ? newTemporaryPassword() : null
  const passwordHash = isNew ? await hashPassword(temporaryPassword) : null

  // Domain errors are thrown outside `transaction()`, which would otherwise
  // re-wrap them as a database failure and answer 500.
  const result = await transaction(async (tx) => {
    if (!(await registration.claimForApproval(applicationId, actorId, tx))) return null

    let userId
    let appId
    if (existing) {
      userId = existing.id
      appId = existing.appId
      // Idempotent: GRANT_ROLE upserts, so re-approval never duplicates a grant.
      await users.grantRole(userId, role.id, { isPrimary: false, grantedBy: actorId }, tx)
    } else {
      appId = memberAppId(applicationId)
      userId = await users.create(
        {
          appId,
          name: application.fullName,
          email: application.email,
          passwordHash,
          initials: initialsOf(application.fullName),
          avatarTone: 'primary',
          status: 'active',
        },
        tx
      )
      // Set here, not in users.create, so the shared create path used by staff
      // and outsider-founder accounts is left exactly as it was.
      await execute('UPDATE users SET must_change_password = 1 WHERE id = ?', [userId], tx)
      await users.grantRole(userId, role.id, { isPrimary: true, grantedBy: actorId }, tx)
    }

    await registration.linkApproval(applicationId, { userId, roleId: role.id }, tx)

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Approved registration ${application.reference}: ${application.fullName} → ${appId} (${isNew ? 'new account' : 'existing account'})`,
        module: 'Registration',
        entityType: 'registration_request',
        entityId: applicationId,
        status: 'success',
      },
      tx
    )

    return { userId, appId }
  })

  if (!result) throw alreadyDecided()

  // Best-effort, AFTER commit: the account already exists, so a mail failure
  // must not undo it. The temporary password is handed to the template only;
  // it is never logged. The reviewer still has it in the UI as a fallback.
  const email = await registrationEmails.sendApprovalEmail({
    to: application.email,
    fullName: application.fullName,
    appId: result.appId,
    temporaryPassword,
    loginUrl: loginUrl(),
    isNew,
  })

  return {
    applicationId,
    status: 'approved',
    emailSent: email.sent,
    account: {
      id: result.userId,
      appId: result.appId,
      name: application.fullName,
      email: application.email,
      isNew,
      // Present only for a newly created account — shown once, never stored.
      temporaryPassword,
    },
  }
}

/**
 * Reject a pending registration. Writes the decision, the reviewer, the time
 * and the reason, plus one audit line — and nothing else.
 */
export async function reject({ applicationId, actorId, reason }) {
  const check = validator()
  const text = check.text('reason', reason, {
    required: true,
    min: 3,
    max: 1000,
    label: 'Rejection reason',
  })
  check.throwIfInvalid()

  const application = await registration.findById(applicationId)
  if (!application) throw new NotFoundError('Registration')
  assertPending(application)

  const rejected = await transaction(async (tx) => {
    if (!(await registration.reject(applicationId, actorId, text, tx))) return false

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Rejected registration ${application.reference}: ${application.fullName}`,
        module: 'Registration',
        entityType: 'registration_request',
        entityId: applicationId,
        status: 'action',
      },
      tx
    )
    return true
  })

  if (!rejected) throw alreadyDecided()

  // Best-effort, AFTER commit.
  const email = await registrationEmails.sendRejectionEmail({
    to: application.email,
    fullName: application.fullName,
    reference: application.reference,
    reason: text,
  })

  return { applicationId, status: 'rejected', emailSent: email.sent }
}

function assertPending(application) {
  if (application.status !== 'pending') throw alreadyDecided(application.status)
}

function alreadyDecided(status) {
  return new ConflictError(
    status
      ? `This registration has already been ${status}.`
      : 'This registration has already been decided.'
  )
}

/** Resolve a role slug to its row via the lookup repository. */
async function findRoleBySlug(slug) {
  const roles = await lookups.findLookup('roles')
  return roles.find((role) => role.slug === slug) ?? null
}

/**
 * A member App ID in its own `AFM-<year>-NNNNN` series — derived from the
 * registration's own id, so it is unique without a counter query, and distinct
 * from the university `ATL-` and outsider-founder `AFX-` series. Mirrors the
 * outsider flow's deterministic App ID.
 */
function memberAppId(registrationId) {
  return `AFM-${new Date().getFullYear()}-${String(registrationId).padStart(5, '0')}`
}

/**
 * 16 characters from a CSPRNG with a guaranteed upper, lower, digit and symbol.
 * Mirrors the generators in accounts.service and the outsider incubation flow.
 */
function newTemporaryPassword() {
  const body = randomBytes(12).toString('base64url').replace(/[-_]/g, 'x')
  return `${body}Aa7!`
}

function initialsOf(name) {
  return (
    String(name ?? '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || null
  )
}
