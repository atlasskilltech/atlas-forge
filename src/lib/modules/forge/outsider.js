import 'server-only'

import { INCUBATION_READINESS_FIELDS } from '@/config/incubation-apply'
import { ValidationError } from '@/lib/errors'
import { outsiderIncubationService } from '@/lib/services'
import { dayTimeLabel } from '@/lib/utils/format'

/**
 * Forge Manager → Public Incubation Applications.
 *
 * Kept beside, not inside, `forge/index.js` and `forge/presenter.js`: this
 * screen reads a different table (`outsider_incubation_applications`) from the
 * existing Incubation Applications screen, and that screen's code is left
 * exactly as it was. Same contract as the other modules, though — routes and
 * pages call these functions, and everything reads through the service layer.
 */

const STATUS = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
}

export const OUTSIDER_FILTERS = ['pending', 'approved', 'rejected', 'all']

const LOGO_URL_PATTERN = /^\/uploads\/startup-logos\/[a-f0-9]{64}\.[a-z]{3,4}$/

/**
 * Everything the review card and its detail view render.
 *
 * The logo is re-checked against the shape `storeImage` issues before it is
 * handed to an `<img src>`: the column should only ever hold such a URL, and
 * this keeps it that way on screen even if a row were edited by hand.
 */
export function toOutsiderApplication(application) {
  const status = STATUS[application.status] ?? { label: application.status, tone: 'neutral' }

  return {
    id: String(application.id),
    applicationId: application.id,
    reference: application.reference,
    applicant: application.applicant,
    startupName: application.startupName,
    tagline: application.tagline,
    problemStatement: application.problemStatement,
    logoUrl:
      application.logoUrl && LOGO_URL_PATTERN.test(application.logoUrl)
        ? application.logoUrl
        : null,
    industry: application.industry?.name ?? '—',
    stage: application.stage?.name ?? '—',
    readiness: INCUBATION_READINESS_FIELDS.map((item) => ({
      field: item.field,
      label: item.label,
      required: item.required,
      value: application.readiness[item.field] ?? null,
    })),
    status: application.status,
    statusLabel: status.label,
    tone: status.tone,
    submittedAt: dayTimeLabel(application.createdAt),
    reviewedAt: application.reviewedAt ? dayTimeLabel(application.reviewedAt) : null,
    reviewerName: application.reviewer?.name ?? null,
    rejectionReason: application.rejectionReason,
    approvedAppId: application.approved.appId,
    approvedStartupSlug: application.approved.startupSlug,
    existingAccount: application.existingAccount,
  }
}

export async function getOutsiderApplications() {
  const applications = await outsiderIncubationService.list({})
  const rows = applications.map(toOutsiderApplication)

  const counts = { all: rows.length, pending: 0, approved: 0, rejected: 0 }
  for (const row of rows) if (row.status in counts) counts[row.status] += 1

  return { applications: rows, counts, filters: OUTSIDER_FILTERS }
}

/**
 * Approve or reject, as the Forge Manager. `decision` comes from the body; the
 * reviewer always comes from the session.
 */
export async function decideOutsiderApplication(user, input = {}) {
  const applicationId = Number(input.applicationId)
  if (!Number.isInteger(applicationId) || applicationId < 1) {
    throw new ValidationError('Choose an application to decide on.')
  }

  if (input.decision === 'approve') {
    return outsiderIncubationService.approve({ applicationId, actorId: user.id })
  }
  if (input.decision === 'reject') {
    return outsiderIncubationService.reject({
      applicationId,
      actorId: user.id,
      reason: input.reason,
    })
  }

  throw new ValidationError('Decision must be approve or reject.', {
    fields: { decision: 'Must be approve or reject.' },
  })
}
