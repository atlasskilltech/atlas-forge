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
 * Registrations submitted from the public "Join the ATLAS Forge Network" page,
 * reviewed here by the Forge Manager.
 *
 * The card, chip and confirmation vocabulary mirror the Public Incubation
 * Applications screen so the two read as one feature. Approve/Reject POST to
 * the role-gated API — the buttons are a convenience, not the control.
 *
 * Phase 5: approving records the decision only. Account creation and the
 * approval email arrive in a later phase.
 */

const FILTER_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  all: 'All',
}

/** A link only when it is a safe http(s) target; never `javascript:` etc. */
function toHref(value) {
  const text = value.trim()
  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text)
      return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
    } catch {
      return null
    }
  }
  // No scheme: allow a bare domain/path (no colon, so `javascript:` is excluded).
  if (/^[^\s:]+\.[^\s]+$/.test(text)) return `https://${text}`
  return null
}

function DetailValue({ row }) {
  const href = row.link ? toHref(row.value) : null
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="break-all text-primary-text underline-offset-4 hover:underline"
      >
        {row.value}
      </a>
    )
  }
  return <span className="break-words whitespace-pre-line text-ink">{row.value}</span>
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
      This email already belongs to {account.name} ({account.appId}). Account creation on approval
      is handled in a later step and will attach to that existing account rather than creating a
      second one.
    </p>
  )
}

export default function RegistrationApplications({ registrations = [], counts = {}, filters = [] }) {
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
        ? registrations
        : registrations.filter((registration) => registration.status === filter),
    [registrations, filter]
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
      const result = await api.post('/api/forge/registrations', {
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
      await api.post('/api/forge/registrations', {
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

  return (
    <>
      <FilterTabs
        label="Registration status"
        options={tabs}
        value={filter}
        onChange={setFilter}
        className="mb-4 lg:mb-[18px]"
      />

      {visible.length === 0 ? (
        <Card padding="lg" className="text-center">
          <p className="text-sm text-muted">
            {filter === 'pending'
              ? 'No registrations are waiting for review.'
              : 'No registrations to show here.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-[18px] md:grid-cols-2 xl:grid-cols-3">
          {visible.map((registration) => (
            <Card key={registration.id} padding="lg" className="flex flex-col lg:px-5 lg:py-5">
              <div className="flex items-start gap-3">
                <Avatar
                  initials={registration.fullName.slice(0, 2).toUpperCase()}
                  tone="primary"
                  size="xl"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg leading-6 font-bold break-words text-ink">
                      {registration.fullName}
                    </h2>
                    <Chip tone={registration.tone}>{registration.statusLabel}</Chip>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">{registration.roleLabel}</p>
                </div>
              </div>

              <dl className="mt-3.5 space-y-1.5 text-[13px] text-muted">
                <div className="flex gap-1.5">
                  <dt>Reference:</dt>
                  <dd className="text-ink">{registration.reference}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Email:</dt>
                  <dd className="min-w-0 break-all text-ink">{registration.email}</dd>
                </div>
                <div className="flex gap-1.5">
                  <dt>Submitted:</dt>
                  <dd className="text-ink">{registration.submittedAt}</dd>
                </div>
              </dl>

              {registration.status === 'pending' && registration.existingAccount ? (
                <p className="mt-3 text-[12px] font-medium text-warning">
                  Email matches existing account {registration.existingAccount.appId}
                </p>
              ) : null}

              <div className="mt-auto flex flex-wrap gap-2.5 pt-4">
                <Button variant="secondary" size="lg" onClick={() => setViewing(registration)}>
                  View Details
                </Button>
                {registration.status === 'pending' ? (
                  <>
                    <Button variant="success" size="lg" onClick={() => setApproving(registration)}>
                      Approve
                    </Button>
                    <Button variant="reject" size="lg" onClick={() => setRejecting(registration)}>
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
                initials={viewing.fullName.slice(0, 2).toUpperCase()}
                tone="primary"
                size="xl"
                className="size-16 text-xl"
              />
              <div className="min-w-0">
                <h2 className="text-xl font-bold break-words text-ink">{viewing.fullName}</h2>
                <p className="mt-1 text-[13px] text-muted">{viewing.roleLabel}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Chip tone={viewing.tone}>{viewing.statusLabel}</Chip>
                  <span className="text-[12px] text-muted">{viewing.reference}</span>
                </div>
              </div>
            </div>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <Detail label="Email">
                <a
                  href={`mailto:${viewing.email}`}
                  className="break-all text-primary-text hover:underline"
                >
                  {viewing.email}
                </a>
              </Detail>
              {viewing.phone ? (
                <Detail label="Phone">
                  <a
                    href={`tel:${viewing.phone.replace(/[^0-9+]/g, '')}`}
                    className="text-primary-text hover:underline"
                  >
                    {viewing.phone}
                  </a>
                </Detail>
              ) : (
                <Detail label="Phone">
                  <span className="text-muted">Not provided</span>
                </Detail>
              )}
              <Detail label="Submitted">{viewing.submittedAt}</Detail>
              <Detail label="Role">{viewing.roleLabel}</Detail>
            </dl>

            {viewing.details.length > 0 ? (
              <>
                <h3 className="mt-6 text-sm font-bold text-ink">Submitted Information</h3>
                <dl className="mt-2 space-y-2.5">
                  {viewing.details.map((row) => (
                    <div key={row.key} className="rounded-tile border border-line bg-canvas p-3.5">
                      <dt className="text-[13px] font-bold text-ink">{row.label}</dt>
                      <dd className="mt-1 text-[13px] leading-[19px]">
                        <DetailValue row={row} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </>
            ) : null}

            {viewing.status !== 'pending' ? (
              <dl className="mt-6 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
                <Detail label="Reviewed by">{viewing.reviewerName ?? '—'}</Detail>
                <Detail label="Reviewed">{viewing.reviewedAt ?? '—'}</Detail>
                <Detail label="Account status">{viewing.credentialStatus}</Detail>
                {viewing.status === 'approved' && viewing.approvedAppId ? (
                  <Detail label="App ID">{viewing.approvedAppId}</Detail>
                ) : null}
                {viewing.status === 'rejected' ? (
                  <div className="sm:col-span-2">
                    <Detail label="Rejection reason">
                      <span className="break-words whitespace-pre-line">
                        {viewing.rejectionReason ?? '—'}
                      </span>
                    </Detail>
                  </div>
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
        title="Approve Registration?"
        description={
          approving
            ? `${approving.fullName}'s registration (${approving.reference}) is marked approved and recorded against your account.`
            : ''
        }
        confirmLabel={submitting ? 'Approving…' : 'Yes, Approve'}
        confirmDisabled={submitting}
        onConfirm={confirmApprove}
      />
      {approving && error ? (
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
            <h2 className="mt-5 text-center text-xl font-bold text-ink">Reject Registration?</h2>
            <p className="mt-2 text-center text-[13px] leading-[18px] text-muted">
              {rejecting.fullName}&rsquo;s registration ({rejecting.reference}) is marked rejected.
              No account is created.
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
              placeholder="Why this registration is not moving forward"
              error={fieldError}
              containerClassName="mt-5"
            />
            {error ? (
              <p role="alert" className="mt-3 text-[13px] text-danger">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <Button
                type="button"
                variant="secondary"
                className="h-11 flex-[2]"
                onClick={closeDialogs}
              >
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
            <h2 className="mt-5 text-center text-xl font-bold text-ink">Registration Approved</h2>
            <p className="mt-2 text-center text-[13px] leading-[18px] text-muted">
              {approved.account.name} now has an active ATLAS Forge network account.
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
                  Share these with the applicant securely. They sign in with the App ID or email and
                  must set a new password before continuing. (The approval email is added in a later
                  phase.)
                </p>
              </div>
            ) : (
              <p className="mt-4 rounded-tile border border-line bg-canvas p-4 text-center text-[13px] text-ink">
                Added to existing account {approved.account.appId}. The applicant signs in with
                their current password.
              </p>
            )}

            <p className="mt-3 text-center text-[12px] leading-[17px] text-muted">
              {approved.emailSent
                ? `An approval email was sent to ${approved.account.email}.`
                : 'The approval email could not be sent — share the details above with the applicant.'}
            </p>

            <div className="mt-6 flex gap-3">
              {approved.account.isNew ? (
                <Button
                  variant="secondary"
                  className="h-11 min-w-0 flex-1"
                  onClick={copyCredentials}
                >
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
