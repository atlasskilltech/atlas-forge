import 'server-only'

import { randomBytes } from 'node:crypto'
import {
  INCUBATION_APPLY_LIMITS,
  INCUBATION_READINESS_FIELDS,
  INCUBATION_READINESS_MAX,
} from '@/config/incubation-apply'
import { hashPassword } from '@/lib/auth/password'
import { transaction } from '@/lib/db'
import {
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  ValidationError,
} from '@/lib/errors'
import * as incubation from '@/lib/repositories/incubation.repository'
import * as outsider from '@/lib/repositories/outsider-incubation.repository'
import * as platform from '@/lib/repositories/platform.repository'
import * as startups from '@/lib/repositories/startups.repository'
import * as users from '@/lib/repositories/users.repository'
import {
  ACCEPTED_IMAGE_LABEL,
  ACCEPTED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
  storeImage,
} from '@/lib/storage/uploads'
import { validator } from '@/lib/validate'
import {
  getIndustries,
  getReadinessItems,
  getRoleBySlug,
  getStages,
  resolveId,
} from './lookups.service'

/**
 * The public "Apply for incubation" application, from `/` to a decision.
 *
 *   submit   anonymous → one `outsider_incubation_applications` row, 'pending'.
 *            Nothing else is written: no user, no startup, no role.
 *   reject   Forge Manager → the row becomes 'rejected'. Nothing else is
 *            written to the Founder/startup/incubation tables.
 *   approve  Forge Manager → the row becomes 'approved' and the applicant is
 *            brought into the normal internal system.
 *
 * Approval is the only bridge to the internal tables, and it deliberately
 * runs as ONE transaction. The existing services that do each step —
 * `startupsService.createForOwner`, `incubationService.submit`,
 * `incubationService.grantFounderAccess` — each open their own transaction,
 * so calling them in sequence could leave an applicant half-promoted (an
 * account with no startup, a startup with no grant) if a later step failed.
 * Instead this file calls the same repository functions those services call,
 * in the same order and with the same values, inside a single transaction
 * that begins by claiming the application. The Founder services themselves
 * are not modified.
 */

/* -------------------------------------------------------------------------- */
/* Field rules                                                                */
/* -------------------------------------------------------------------------- */

/*
 * The same deliberately permissive contact rules as the two landing enquiry
 * forms (see landing.service.js for the reasoning behind each pattern).
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const PHONE_ALLOWED = /^[0-9+()\-.\s]+$/

/** Only URLs `storeImage` issues — the shape `startups.logo_url` accepts. */
const LOGO_URL_PATTERN = /^\/uploads\/startup-logos\/[a-f0-9]{64}\.[a-z]{3,4}$/

/* -------------------------------------------------------------------------- */
/* Anti-flood                                                                 */
/* -------------------------------------------------------------------------- */

/** Everything from one address across this window... */
const THROTTLE_WINDOW_SECONDS = 60 * 60
/** ...is capped here. An application is a considered form, not a chat message. */
const THROTTLE_MAX = 5

const trimUserAgent = (value) => (value ? String(value).slice(0, 255) : null)

/* -------------------------------------------------------------------------- */
/* Form options                                                               */
/* -------------------------------------------------------------------------- */

/**
 * What the public form needs to render: the Industry and Stage choices the
 * Founder form offers, the readiness fields with their stored copy, and the
 * logo rules from the module that enforces them.
 */
export async function getFormOptions() {
  const [industries, stages, readinessItems] = await Promise.all([
    getIndustries(),
    getStages(),
    getReadinessItems(),
  ])

  const bySlug = new Map(readinessItems.map((item) => [item.slug, item]))

  return {
    industries: industries.map((item) => ({ slug: item.slug, name: item.name })),
    stages: stages.map((item) => ({ slug: item.slug, name: item.name })),
    readiness: INCUBATION_READINESS_FIELDS.map((item) => ({
      field: item.field,
      label: bySlug.get(item.slug)?.name ?? item.label,
      hint: bySlug.get(item.slug)?.hint ?? item.hint,
      required: item.required,
      maxLength: INCUBATION_READINESS_MAX,
    })),
    logoUpload: {
      accept: ACCEPTED_IMAGE_MIME,
      formats: ACCEPTED_IMAGE_LABEL,
      maxBytes: MAX_IMAGE_BYTES,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Public submission                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Validate and store one public application.
 *
 * Order matters: every field is checked first (one 422 listing all of them),
 * then the flood guards, and only then is the logo written to disk — so a
 * rejected or throttled request never leaves a file behind.
 *
 * @param {object} input  Text fields, already read from the multipart body.
 * @param {File|null} logo
 * @returns {Promise<{ reference: string }>}
 */
export async function submit(input = {}, logo = null, { sourceIp = '', userAgent = null } = {}) {
  const check = validator()

  const fullName = check.text('fullName', input.fullName, {
    required: true,
    min: 2,
    max: INCUBATION_APPLY_LIMITS.fullName,
    label: 'Full name',
  })

  const email = check.text('email', input.email, {
    required: true,
    max: INCUBATION_APPLY_LIMITS.email,
    label: 'Email',
  })
  if (email !== undefined && !EMAIL_PATTERN.test(email)) {
    check.reject('email', 'Enter a valid email address.')
  }

  const phone = check.text('phone', input.phone, {
    required: true,
    max: INCUBATION_APPLY_LIMITS.phone,
    label: 'Phone number',
  })
  if (phone !== undefined) {
    if (!PHONE_ALLOWED.test(phone)) {
      check.reject('phone', 'Use digits, spaces and + ( ) - only.')
    } else {
      const digits = phone.replace(/\D/g, '').length
      if (digits < 7 || digits > 15) check.reject('phone', 'Enter a valid phone number.')
    }
  }

  const startupName = check.text('startupName', input.startupName, {
    required: true,
    min: 2,
    max: INCUBATION_APPLY_LIMITS.startupName,
    label: 'Startup name',
  })
  const tagline = check.text('tagline', input.tagline, {
    max: INCUBATION_APPLY_LIMITS.tagline,
    label: 'Tagline',
  })
  const problemStatement = check.text('problemStatement', input.problemStatement, {
    max: INCUBATION_APPLY_LIMITS.problemStatement,
    label: 'Problem statement',
  })

  const [industries, stages] = await Promise.all([getIndustries(), getStages()])
  const industrySlug = check.oneOf(
    'industrySlug',
    input.industrySlug,
    industries.map((item) => item.slug),
    { required: true, label: 'Industry' }
  )
  const stageSlug = check.oneOf(
    'stageSlug',
    input.stageSlug,
    stages.map((item) => item.slug),
    { required: true, label: 'Current stage' }
  )

  const readiness = {}
  for (const item of INCUBATION_READINESS_FIELDS) {
    readiness[item.field] = check.text(item.field, input[item.field], {
      required: item.required,
      max: INCUBATION_READINESS_MAX,
      label: item.label,
    })
  }

  // A browser sends an empty file part when no file was chosen; that is "no
  // logo", not a bad one. Anything else in the `logo` part must be a file.
  const hasLogo = Boolean(logo && typeof logo === 'object' && logo.size > 0)
  if (logo !== null && logo !== undefined && typeof logo !== 'object') {
    check.reject('logo', 'Upload the logo as an image file.')
  }
  if (hasLogo) checkLogoClaims(check, logo)

  check.throwIfInvalid()

  const normalisedEmail = email.toLowerCase()

  if ((await outsider.countPendingByEmail(normalisedEmail)) > 0) {
    throw new ConflictError(
      'An application from this email address is already awaiting review. Our team will be in touch.'
    )
  }
  if (sourceIp && (await outsider.countRecentByIp(sourceIp, THROTTLE_WINDOW_SECONDS)) >= THROTTLE_MAX) {
    throw new TooManyRequestsError(
      'Too many applications from this network. Please try again later.',
      THROTTLE_WINDOW_SECONDS
    )
  }

  let logoUrl = null
  if (hasLogo) {
    try {
      logoUrl = (await storeImage(logo, 'startup-logos')).url
    } catch (error) {
      // `storeImage` reports against its own `file` field; this form calls it `logo`.
      if (error instanceof ValidationError) {
        throw new ValidationError(error.message, { fields: { logo: error.message } })
      }
      throw error
    }
  }

  const [industryId, stageId] = await Promise.all([
    resolveId(getIndustries, industrySlug),
    resolveId(getStages, stageSlug),
  ])

  const row = {
    fullName,
    email: normalisedEmail,
    phone,
    startupName,
    tagline: tagline ?? null,
    problemStatement: problemStatement ?? null,
    industryId,
    stageId,
    logoUrl,
    pitchDeck: readiness.pitchDeck,
    productDemo: readiness.productDemo ?? null,
    productAssets: readiness.productAssets ?? null,
    keyPersonnel: readiness.keyPersonnel,
    sourceIp,
    userAgent: trimUserAgent(userAgent),
  }

  // The reference is random, so a collision is possible in principle; the
  // unique key catches it and a fresh code is drawn.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = newReference()
    try {
      await outsider.create({ ...row, reference })
      return { reference }
    } catch (error) {
      if (error?.code !== 'ER_DUP_ENTRY') throw error
    }
  }
  throw new ConflictError('The application could not be saved. Please try again.')
}

/* -------------------------------------------------------------------------- */
/* Review                                                                     */
/* -------------------------------------------------------------------------- */

export const list = (filters) => outsider.findAll(filters)
export const getById = (id) => outsider.findById(id)

/**
 * Reject a pending application. Writes the decision, the reviewer, the time
 * and the reason to the outsider row, plus one audit line — and nothing to
 * the Founder, startup or incubation tables.
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

  const application = await outsider.findById(applicationId)
  if (!application) throw new NotFoundError('Application')
  assertPending(application)

  // Domain errors are thrown outside `transaction()`, which would otherwise
  // re-wrap them as a database failure and answer 500.
  const rejected = await transaction(async (tx) => {
    if (!(await outsider.reject(applicationId, actorId, text, tx))) return false

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Rejected public incubation application ${application.reference}: ${application.startupName}`,
        module: 'Incubation',
        entityType: 'outsider_incubation_application',
        entityId: applicationId,
        status: 'action',
      },
      tx
    )
    return true
  })

  if (!rejected) throw alreadyDecided()
  return { applicationId, status: 'rejected' }
}

/**
 * Approve a pending application and bring the applicant into the internal
 * Founder/incubation system.
 *
 * Mirrors, step for step, what the signed-in flow produces for a founder:
 *
 *   users + user_roles       the account, holding the `founder` role
 *   startups + members       `createForOwner`: status 'pending', owner as 'Founder'
 *   incubation_applications  `submit`: readiness rows and derived completion %
 *   → approved               `grantFounderAccess`: review + founder_access_grants
 *   activity_logs, notifications
 *
 * The account: when a user already holds the applicant's email that account
 * is used — `uq_users_email` makes a second one impossible, and the reviewer
 * saw the match before confirming. Otherwise a new account is created with an
 * App ID in its own `AFX-` series (so it can never collide with a university
 * `ATL-` ID) and a random temporary password. The platform sends no email, so
 * that password is returned ONCE, here, for the reviewer to pass on; only its
 * scrypt hash is stored.
 */
export async function approve({ applicationId, actorId }) {
  const application = await outsider.findById(applicationId)
  if (!application) throw new NotFoundError('Application')
  assertPending(application)

  const [founderRole, readinessItems] = await Promise.all([
    getRoleBySlug('founder'),
    getReadinessItems(),
  ])
  if (!founderRole) throw new ValidationError('Founder role is missing from reference data.')

  const existing = await outsider.findUserByEmail(application.applicant.email)
  let hasActiveGrant = false

  if (existing) {
    if (existing.isDeleted || existing.status !== 'active') {
      throw new ConflictError(
        `This email belongs to an account (${existing.appId}) that is not active. Reactivate it or reject this application.`
      )
    }
    if (await startups.findByOwner(existing.id)) {
      throw new ConflictError(
        `This email belongs to ${existing.appId}, which already owns a startup on ATLAS Forge. Reject this application or ask the applicant to use a different email.`
      )
    }
    const grants = await incubation.findGrants({ userId: existing.id })
    hasActiveGrant = grants.some((grant) => grant.isActive)
  }

  const temporaryPassword = existing ? null : newTemporaryPassword()
  const passwordHash = temporaryPassword ? await hashPassword(temporaryPassword) : null

  const readinessBySlug = Object.fromEntries(
    INCUBATION_READINESS_FIELDS.map((item) => [item.slug, application.readiness[item.field]])
  )
  const filled = readinessItems.filter((item) =>
    String(readinessBySlug[item.slug] ?? '').trim()
  ).length
  const completionPct =
    readinessItems.length === 0 ? 0 : Math.round((filled / readinessItems.length) * 100)

  const name = application.startupName.trim()
  // The person as the platform knows them: an existing account keeps its own name.
  const accountName = existing?.name ?? application.applicant.name
  const logoUrl =
    application.logoUrl && LOGO_URL_PATTERN.test(application.logoUrl) ? application.logoUrl : null

  const result = await transaction(async (tx) => {
    // Claim first. Everything below runs only for the one caller whose UPDATE
    // moved the row out of 'pending'; a concurrent approve or reject blocks on
    // this row lock and then matches nothing.
    if (!(await outsider.claimForApproval(applicationId, actorId, tx))) return null

    let userId = existing?.id ?? null
    let appId = existing?.appId ?? null

    if (!existing) {
      appId = `AFX-${new Date().getFullYear()}-${String(applicationId).padStart(5, '0')}`
      userId = await users.create(
        {
          appId,
          name: application.applicant.name,
          email: application.applicant.email,
          passwordHash,
          initials: initialsOf(application.applicant.name),
          avatarTone: 'primary',
          status: 'active',
        },
        tx
      )
    }

    // A new account's only role is founder, so it is also the primary one.
    await users.grantRole(
      userId,
      founderRole.id,
      { isPrimary: !existing, grantedBy: actorId },
      tx
    )

    // --- startupsService.createForOwner ------------------------------------
    const slug = await startups.nextSlug(name, tx)
    const startupId = await startups.create(
      {
        slug,
        name,
        tagline: application.tagline,
        problemStatement: application.problemStatement,
        industryId: application.industry?.id ?? null,
        stageId: application.stage?.id ?? null,
        ownerUserId: userId,
        isHiring: false,
        openRoles: 0,
        logoUrl,
      },
      tx
    )
    await startups.addMember(startupId, userId, 'Founder', tx)

    // --- incubationService.submit ------------------------------------------
    const incubationApplicationId = await incubation.createApplication(
      {
        applicantId: userId,
        startupId,
        ideaName: name,
        problemStatement: application.problemStatement,
        stageId: application.stage?.id ?? null,
        teamMemberIds: null,
        status: 'pending',
        completionPct,
        submittedAt: application.createdAt ? new Date(application.createdAt) : new Date(),
      },
      tx
    )
    for (const item of readinessItems) {
      const value = String(readinessBySlug[item.slug] ?? '').trim()
      if (value) await incubation.setReadinessValue(incubationApplicationId, item.id, value, tx)
    }

    // --- incubationService.grantFounderAccess ------------------------------
    await incubation.review(incubationApplicationId, 'approved', actorId, tx)
    if (!hasActiveGrant) {
      await incubation.createGrant(
        {
          userId,
          startupId,
          applicationId: incubationApplicationId,
          grantedBy: actorId,
          reason: `Approved public application ${application.reference}`,
        },
        tx
      )
    }

    await outsider.linkApproval(
      applicationId,
      { userId, startupId, incubationApplicationId },
      tx
    )

    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Approved public incubation application ${application.reference}: ${name}`,
        module: 'Incubation',
        entityType: 'outsider_incubation_application',
        entityId: applicationId,
        status: 'success',
      },
      tx
    )
    await platform.logActivity(
      {
        actorUserId: actorId,
        action: `Granted Founder access: ${accountName}`,
        module: 'Access',
        entityType: 'incubation_application',
        entityId: incubationApplicationId,
        status: 'success',
      },
      tx
    )
    await platform.createNotification(
      {
        userId,
        type: 'access',
        title: 'Founder access granted',
        body: `You can now manage ${name} on ATLAS Forge.`,
        linkUrl: '/founder/home',
      },
      tx
    )

    return { userId, appId, startupId, slug, incubationApplicationId }
  })

  if (!result) throw alreadyDecided()

  return {
    applicationId,
    status: 'approved',
    reference: application.reference,
    startup: { id: result.startupId, slug: result.slug, name },
    incubationApplicationId: result.incubationApplicationId,
    account: {
      userId: result.userId,
      appId: result.appId,
      email: application.applicant.email,
      name: accountName,
      isNew: !existing,
      // Present only for a newly created account, and only in this response.
      temporaryPassword,
    },
  }
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

/**
 * The name and type the browser attached to the logo, checked up front so a
 * wrong file is reported with the rest of the form's errors.
 *
 * These are claims, not proof — the caller controls both. `storeImage` still
 * decides from the file's leading bytes, and it names the stored file from its
 * hash and detected format, so nothing from `logo.name` ever reaches the disk.
 * An empty type is tolerated (some platforms send none); a wrong one is not.
 */
function checkLogoClaims(check, logo) {
  const message = `The logo must be a ${ACCEPTED_IMAGE_LABEL} image.`
  const extension = String(logo.name ?? '').split('.').pop()?.toLowerCase()

  if (!LOGO_EXTENSIONS.includes(extension)) {
    check.reject('logo', message)
  } else if (logo.type && !ACCEPTED_IMAGE_MIME.split(',').includes(logo.type)) {
    check.reject('logo', message)
  } else if (logo.size > MAX_IMAGE_BYTES) {
    check.reject(
      'logo',
      `That image is too large. The limit is ${Math.round(MAX_IMAGE_BYTES / (1024 * 1024))}MB.`
    )
  }
}

function assertPending(application) {
  if (application.status !== 'pending') throw alreadyDecided(application.status)
}

function alreadyDecided(status) {
  return new ConflictError(
    status
      ? `This application has already been ${status}.`
      : 'This application has already been decided.'
  )
}

/** Unambiguous characters only — no 0/O or 1/I — so a reference can be read aloud. */
const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function newReference() {
  const bytes = randomBytes(6)
  const code = [...bytes].map((byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]).join('')
  return `AFI-${new Date().getFullYear()}-${code}`
}

/**
 * 16 characters from a CSPRNG, with a guaranteed upper, lower, digit and
 * symbol so it satisfies any complexity rule a manager may apply by eye.
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
