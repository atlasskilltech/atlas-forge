import 'server-only'

import {
  ANGEL_NETWORKS,
  CONDUCT_SESSION,
  INCUBATION_SUPPORT_NEEDS,
  INVEST_SECTORS,
  LOOKING_FOR_INCUBATION,
  MENTORSHIP_AREAS,
  OPEN_TO_INVESTING,
  PREFERRED_AUDIENCE,
  REGISTRATION_ROLE_LABEL,
  SCHOOLS,
  SEEKING_MENTORSHIP,
  SESSION_TYPES,
  TYPE_OF_SUPPORT,
  WILLING_TO_MENTOR,
} from '@/config/registration'
import { ValidationError } from '@/lib/errors'
import { registrationService } from '@/lib/services'
import { dayTimeLabel } from '@/lib/utils/format'

/**
 * Forge Manager → Registrations (public "Join the ATLAS Forge Network" requests).
 *
 * Kept beside `forge/index.js`, like the outsider module: it reads a different
 * table (`registration_requests`) and leaves every existing Forge screen as it
 * was. Same contract — routes and pages call these functions, and everything
 * reads through the service layer.
 */

const STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const REGISTRATION_FILTERS = ['pending', 'approved', 'rejected', 'all']

const labelMap = (options) => Object.fromEntries(options.map((option) => [option.value, option.label]))

/**
 * The role-specific answers, in the order they are asked on the form, with the
 * labels the reviewer should read. `map` turns a stored slug back into its
 * human label; `multi` joins an array of them; `link` marks a value the detail
 * view may render as a link.
 */
const FIELD_SPECS = [
  { key: 'school', label: 'School', map: labelMap(SCHOOLS) },
  { key: 'department', label: 'Department' },
  { key: 'graduationYear', label: 'Batch / Graduation Year' },
  { key: 'course', label: 'Course' },
  { key: 'currentCity', label: 'Current City' },
  { key: 'currentRoleCompany', label: 'Current Role & Company' },
  { key: 'organisation', label: 'Organisation' },
  { key: 'designation', label: 'Designation' },
  { key: 'linkedinUrl', label: 'LinkedIn Profile URL', link: true },
  { key: 'industrySector', label: 'Industry / Sector' },
  { key: 'yearsExperience', label: 'Years of Professional Experience' },
  { key: 'willingToMentor', label: 'Willing to Mentor?', map: labelMap(WILLING_TO_MENTOR) },
  { key: 'seekingMentorship', label: 'Seeking Mentorship?', map: labelMap(SEEKING_MENTORSHIP) },
  {
    key: 'mentorshipAreas',
    label: 'Areas of Mentorship Interest',
    map: labelMap(MENTORSHIP_AREAS),
    multi: true,
  },
  { key: 'conductSession', label: 'Conduct a Session or Event?', map: labelMap(CONDUCT_SESSION) },
  { key: 'sessionTypes', label: 'Type of Session', map: labelMap(SESSION_TYPES), multi: true },
  {
    key: 'preferredAudience',
    label: 'Preferred Audience',
    map: labelMap(PREFERRED_AUDIENCE),
    multi: true,
  },
  { key: 'sessionTopics', label: 'Session Topics' },
  { key: 'openToInvesting', label: 'Open to Investing?', map: labelMap(OPEN_TO_INVESTING) },
  {
    key: 'lookingForIncubation',
    label: 'Looking for Incubation Support?',
    map: labelMap(LOOKING_FOR_INCUBATION),
  },
  {
    key: 'incubationSupportNeeds',
    label: 'Support Needed',
    map: labelMap(INCUBATION_SUPPORT_NEEDS),
    multi: true,
  },
  {
    key: 'investSectors',
    label: 'Preferred Sectors to Invest In',
    map: labelMap(INVEST_SECTORS),
    multi: true,
  },
  { key: 'angelNetwork', label: 'Part of an Angel Network?', map: labelMap(ANGEL_NETWORKS) },
  { key: 'typeOfSupport', label: 'Type of Support', map: labelMap(TYPE_OF_SUPPORT), multi: true },
  { key: 'portfolioLink', label: 'Portfolio / Work Link', link: true },
  { key: 'message', label: 'Message' },
  { key: 'additionalComments', label: 'Additional Comments or Questions' },
]

/** Turn the stored `details` object into ordered, human-readable display rows. */
function toDetailRows(details = {}) {
  const rows = []
  for (const spec of FIELD_SPECS) {
    const raw = details[spec.key]
    if (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
      continue
    }

    let value
    if (spec.multi && Array.isArray(raw)) {
      value = raw.map((item) => spec.map?.[item] ?? item).join(', ')
    } else if (spec.map) {
      value = spec.map[raw] ?? String(raw)
    } else {
      value = String(raw)
    }

    rows.push({ key: spec.key, label: spec.label, value, link: Boolean(spec.link) })
  }
  return rows
}

/**
 * A plain-language credential state for the reviewer — never the password
 * itself, only where the account is in its lifecycle.
 */
function credentialStatus(registration) {
  if (registration.status === 'rejected') return 'Rejected — no account'
  if (registration.status !== 'approved' || !registration.approved.userId) {
    return 'Account not created'
  }
  return registration.approved.mustChangePassword
    ? 'Account created · password change required'
    : 'Account created · password changed'
}

export function toRegistrationView(registration) {
  const status = STATUS[registration.status] ?? { label: registration.status, tone: 'neutral' }

  return {
    credentialStatus: credentialStatus(registration),
    approvedAppId: registration.approved.appId,
    id: String(registration.id),
    applicationId: registration.id,
    reference: registration.reference,
    fullName: registration.fullName,
    email: registration.email,
    phone: registration.phone,
    roleCategory: registration.roleCategory,
    roleLabel: REGISTRATION_ROLE_LABEL[registration.roleCategory] ?? registration.roleCategory,
    details: toDetailRows(registration.details),
    status: registration.status,
    statusLabel: status.label,
    tone: status.tone,
    submittedAt: dayTimeLabel(registration.createdAt),
    reviewedAt: registration.reviewedAt ? dayTimeLabel(registration.reviewedAt) : null,
    reviewerName: registration.reviewer?.name ?? null,
    rejectionReason: registration.rejectionReason,
    existingAccount: registration.existingAccount,
  }
}

export async function getRegistrations() {
  const registrations = await registrationService.list({})
  const rows = registrations.map(toRegistrationView)

  const counts = { all: rows.length, pending: 0, approved: 0, rejected: 0 }
  for (const row of rows) if (row.status in counts) counts[row.status] += 1

  return { registrations: rows, counts, filters: REGISTRATION_FILTERS }
}

/**
 * Approve or reject, as the Forge Manager. `decision` comes from the body; the
 * reviewer always comes from the session.
 */
export async function decideRegistration(user, input = {}) {
  const applicationId = Number(input.applicationId)
  if (!Number.isInteger(applicationId) || applicationId < 1) {
    throw new ValidationError('Choose a registration to decide on.')
  }

  if (input.decision === 'approve') {
    return registrationService.approve({ applicationId, actorId: user.id })
  }
  if (input.decision === 'reject') {
    return registrationService.reject({ applicationId, actorId: user.id, reason: input.reason })
  }

  throw new ValidationError('Decision must be approve or reject.', {
    fields: { decision: 'Must be approve or reject.' },
  })
}
