'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import {
  ActionDialog,
  Avatar,
  Button,
  Card,
  Chip,
  FilterTabs,
  FormField,
  Modal,
  SuccessMark,
} from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Public incubation applications — submitted from the website by people with
 * no account, reviewed here.
 *
 * Deliberately its own component rather than a mode of
 * `IncubationApplications`: that screen reviews signed-in founders' records
 * and keeps working exactly as before. The card, chip and confirmation
 * vocabulary is the same so the two read as one feature.
 */

const FILTER_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
}

/**
 * Only http(s) answers become links. A readiness answer is free text typed by
 * an anonymous visitor, so a `javascript:` URL must render as text, never as
 * something a manager can click.
 */
function ReadinessValue({ value }) {
  if (!value) return <span className="text-muted">Not provided</span>

  let url = null
  try {
    const parsed = new URL(value.trim())
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') url = parsed.href
  } catch {
    /* not a URL — shown as text */
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="break-all text-primary-text underline-offset-4 hover:underline"
      >
        {value}
      </a>
    )
  }
  return <span className="break-words whitespace-pre-line text-ink">{value}</span>
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-[12px] font-semibold tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 text-[13px] leading-[19px] text-ink">{children}</dd>
    </div>
  )
}

function AccountMatchNote({ account }) {
  if (!account) return null
  return (
    <p className="rounded-tile border border-warning-fill/40 bg-warning-fill/10 px-3 py-2 text-[12.5px] leading-[18px] text-warning">
      This email already belongs to {account.name} ({account.appId}). Approving adds Founder
      access and the startup to that existing account instead of creating a new one.
    </p>
  )
}

export default function OutsiderApplications({ applications = [], counts = {}, filters = [] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [filter, setFilter] = useState('pending')
  const [viewing, setViewing] = useState(null)
  const [approving, setApproving] = useState(null)
  const [rejecting, setRejecting] = useState(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [fieldError, setFieldError] = useState(null)
  const [approved, setApproved] = useState(null)
  const [copied, setCopied] = useState(false)

  const visible = useMemo(
    () =>
      filter === 'all'
        ? applications
        : applications.filter((application) => application.status === filter),
    [applications, filter]
  )

  const tabs = filters.map((value) => ({
    value,
    label: `${FILTER_LABELS[value] ?? value} (${counts[value] ?? 0})`,
  }))

  function closeDialogs() {
    setApproving(null)
    setRejecting(null)
    setReason('')
    setError(null)
    setFieldError(null)
  }

  async function confirmApprove() {
    setSubmitting(true)
    setError(null)
    try {
      const result = await api.post('/api/forge/outsider-applications', {
        applicationId: approving.applicationId,
        decision: 'approve',
      })
      closeDialogs()
      setViewing(null)
      setCopied(false)
      setApproved(result)
      startTransition(() => router.refresh())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmReject(event) {
    event.preventDefault()
    if (reason.trim().length < 3) {
      setFieldError('Give the applicant a reason (at least 3 characters).')
      return
    }

    setSubmitting(true)
    setError(null)
    setFieldError(null)
    try {
      await api.post('/api/forge/outsider-applications', {
        applicationId: rejecting.applicationId,
        decision: 'reject',
        reason: reason.trim(),
      })
      closeDialogs()
      setViewing(null)
      startTransition(() => router.refresh())
    } catch (requestError) {
      setFieldError(requestError.fields?.reason ?? null)
      setError(requestError.fields?.reason ? null : requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function copyCredentials() {
    if (!approved?.account) return
    const { appId, email, temporaryPassword } = approved.account
    const text = `App ID: ${appId}\nEmail: ${email}\nTemporary password: ${temporaryPassword}`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      <FilterTabs
        label="Application status"
        options={tabs}
        value={filter}
        onChange={setFilter}
        className="mb-4 lg:mb-[18px]"
      />

      {visible.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-muted">
            {filter === 'pending'
              ? 'No public applications are waiting for review.'
              : 'No applications to show here.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
          {visible.map((application) => (
            <Card key={application.id} padding="lg" className="flex flex-col lg:px-5 lg:py-5">
              <div className="flex items-start gap-3">
                <Avatar
                  initials={application.startupName.slice(0, 2).toUpperCase()}
                  src={application.logoUrl}
                  tone="primary"
                  shape="square"
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg leading-6 font-bold break-words text-ink">
                      {application.startupName}
                    </h2>
                    <Chip tone={application.tone}>{application.statusLabel}</Chip>
                  </div>
                  {application.tagline ? (
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-muted">
                      {application.tagline}
                    </p>
                  ) : null}
                </div>
              </div>

              <dl className="mt-3.5 space-y-1.5 text-[13px] text-muted">
                <div className="flex gap-1.5">
                  <dt>Applicant:</dt>
                  <dd className="min-w-0 break-words text-ink">{application.applicant.name}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Reference:</dt>
                  <dd className="text-ink">{application.reference}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Industry · Stage:</dt>
                  <dd className="text-ink">
                    {application.industry} · {application.stage}
                  </dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Submitted:</dt>
                  <dd className="text-ink">{application.submittedAt}</dd>
                </div>
              </dl>

              {application.status === 'pending' && application.existingAccount ? (
                <p className="mt-3 text-[12px] font-medium text-warning">
                  Email matches existing account {application.existingAccount.appId}
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-2.5 pt-4">
                <Button variant="secondary" size="lg" onClick={() => setViewing(application)}>
                  View Details
                </Button>
                {application.status === 'pending' ? (
                  <>
                    <Button variant="success" size="lg" onClick={() => setApproving(application)}>
                      Approve
                    </Button>
                    <Button variant="reject" size="lg" onClick={() => setRejecting(application)}>
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Details ------------------------------------------------------ */}
      <Modal
        open={Boolean(viewing) && !approving && !rejecting}
        onClose={() => setViewing(null)}
        size="lg"
        showClose
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-5 sm:p-8"
      >
        {viewing ? (
          <div>
            <div className="flex items-start gap-4 pr-10">
              <Avatar
                initials={viewing.startupName.slice(0, 2).toUpperCase()}
                src={viewing.logoUrl}
                tone="primary"
                shape="square"
                size="xl"
                className="size-16 text-xl"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-bold break-words text-ink">{viewing.startupName}</h2>
                {viewing.tagline ? (
                  <p className="mt-1 text-[13px] text-muted">{viewing.tagline}</p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip tone={viewing.tone}>{viewing.statusLabel}</Chip>
                  <span className="text-[12px] text-muted">{viewing.reference}</span>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Applicant">{viewing.applicant.name}</Detail>
              <Detail label="Email">
                <a
                  href={`mailto:${viewing.applicant.email}`}
                  className="break-all text-primary-text hover:underline"
                >
                  {viewing.applicant.email}
                </a>
              </Detail>
              <Detail label="Phone">
                <a
                  href={`tel:${viewing.applicant.phone.replace(/[^0-9+]/g, '')}`}
                  className="text-primary-text hover:underline"
                >
                  {viewing.applicant.phone}
                </a>
              </Detail>
              <Detail label="Submitted">{viewing.submittedAt}</Detail>
              <Detail label="Industry">{viewing.industry}</Detail>
              <Detail label="Current Stage">{viewing.stage}</Detail>
            </dl>

            <dl className="mt-4">
              <Detail label="Problem Statement">
                {viewing.problemStatement ? (
                  <span className="break-words whitespace-pre-line">
                    {viewing.problemStatement}
                  </span>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </Detail>
            </dl>

            <h3 className="mt-6 text-sm font-bold text-ink">Startup Readiness</h3>
            <dl className="mt-2 space-y-2.5">
              {viewing.readiness.map((item) => (
                <div key={item.field} className="rounded-tile border border-line bg-canvas p-3.5">
                  <dt className="text-[13px] font-bold text-ink">
                    {item.label}
                    {item.required ? <span className="ml-1 text-muted">(required)</span> : null}
                  </dt>
                  <dd className="mt-1 text-[13px] leading-[19px]">
                    <ReadinessValue value={item.value} />
                  </dd>
                </div>
              ))}
            </dl>

            {viewing.status !== 'pending' ? (
              <dl className="mt-6 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <Detail label="Reviewed by">{viewing.reviewerName ?? '—'}</Detail>
                <Detail label="Reviewed">{viewing.reviewedAt ?? '—'}</Detail>
                {viewing.status === 'rejected' ? (
                  <div className="sm:col-span-2">
                    <Detail label="Rejection reason">
                      <span className="break-words whitespace-pre-line">
                        {viewing.rejectionReason ?? '—'}
                      </span>
                    </Detail>
                  </div>
                ) : null}
                {viewing.status === 'approved' ? (
                  <Detail label="Founder account">{viewing.approvedAppId ?? '—'}</Detail>
                ) : null}
              </dl>
            ) : (
              <div className="mt-6 space-y-3 border-t border-line pt-4">
                <AccountMatchNote account={viewing.existingAccount} />
                <div className="flex flex-wrap gap-2.5">
                  <Button variant="success" size="lg" onClick={() => setApproving(viewing)}>
                    Approve
                  </Button>
                  <Button variant="reject" size="lg" onClick={() => setRejecting(viewing)}>
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* ---- Approve ------------------------------------------------------ */}
      <ActionDialog
        open={Boolean(approving)}
        onClose={closeDialogs}
        tone="success"
        title="Approve Application?"
        description={
          approving
            ? approving.existingAccount
              ? `${approving.startupName} is created and ${approving.existingAccount.appId} gains Founder access immediately. The application is marked approved.`
              : `A Founder account is created for ${approving.applicant.name}, with ${approving.startupName} as their startup. You will be shown their sign-in details once.`
            : ''
        }
        confirmLabel={submitting ? 'Approving…' : 'Yes, Approve'}
        confirmDisabled={submitting}
        onConfirm={confirmApprove}
      />
      {approving && error ? (
        // Rendered above the dialog, so a refusal (already decided, email in
        // use) is visible without closing it.
        <div className="fixed inset-x-4 bottom-4 z-[110] mx-auto max-w-[440px]" role="alert">
          <p className="rounded-tile bg-danger-fill px-4 py-3 text-[13px] font-medium text-white shadow-modal">
            {error}
          </p>
        </div>
      ) : null}

      {/* ---- Reject ------------------------------------------------------- */}
      <Modal
        open={Boolean(rejecting)}
        onClose={closeDialogs}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto pt-8"
      >
        {rejecting ? (
          <form onSubmit={confirmReject} noValidate>
            <SuccessMark tone="danger" glyph="!" />
            <h2 className="mt-5 text-center text-xl font-bold text-ink">Reject Application?</h2>
            <p className="mt-2 text-center text-[13px] leading-[18px] text-muted">
              {rejecting.startupName} ({rejecting.reference}) is marked rejected. No account or
              startup is created.
            </p>
            <FormField
              as="textarea"
              label="Rejection reason"
              name="reason"
              rows={3}
              maxLength={1000}
              required
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why this application is not moving forward"
              error={fieldError}
              containerClassName="mt-5"
            />
            {error ? (
              <p role="alert" className="mt-3 text-[13px] text-danger">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <Button type="button" variant="secondary" className="h-11 flex-[2]" onClick={closeDialogs}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="dangerSolid"
                className="h-11 flex-[3]"
                disabled={submitting}
              >
                {submitting ? 'Rejecting…' : 'Yes, Reject'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>

      {/* ---- Approved ----------------------------------------------------- */}
      <Modal open={Boolean(approved)} onClose={() => setApproved(null)} className="pt-8">
        {approved ? (
          <div>
            <SuccessMark />
            <h2 className="mt-5 text-center text-xl font-bold text-ink">Application Approved</h2>
            <p className="mt-2 text-center text-[13px] leading-[18px] text-muted">
              {approved.startup.name} is now in the Founder system and{' '}
              {approved.account.name} has Founder access.
            </p>

            {approved.account.isNew ? (
              <div className="mt-5 rounded-tile border border-line bg-canvas p-4 text-[13px]">
                <p className="font-bold text-ink">Sign-in details — shown only once</p>
                <dl className="mt-2 space-y-1">
                  <div className="flex gap-2">
                    <dt className="w-[120px] shrink-0 text-muted">App ID</dt>
                    <dd className="font-mono text-ink">{approved.account.appId}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[120px] shrink-0 text-muted">Email</dt>
                    <dd className="min-w-0 break-all text-ink">{approved.account.email}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="w-[120px] shrink-0 text-muted">Temp password</dt>
                    <dd className="font-mono break-all text-ink">
                      {approved.account.temporaryPassword}
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-[12px] leading-[17px] text-muted">
                  Share these with the applicant securely. They sign in with the App ID or email
                  and should change the password after signing in.
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-tile border border-line bg-canvas p-4 text-center text-[13px] text-ink">
                Added to existing account {approved.account.appId}. The applicant signs in with
                their current password.
              </p>
            )}

            <div className="mt-6 flex gap-3">
              {approved.account.isNew ? (
                <Button variant="secondary" className="h-11 min-w-0 flex-1" onClick={copyCredentials}>
                  {copied ? 'Copied' : 'Copy Details'}
                </Button>
              ) : null}
              <Button className="h-11 min-w-0 flex-1" onClick={() => setApproved(null)}>
                Done
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
