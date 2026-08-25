'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  ActionDialog,
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  SectionLabel,
} from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/BM/Role Management.png
 *            /reference/mast phone ui/BM/Role Management.png
 *            /reference/mast ui/Overlay/BM Role Management {Grant,Revoke} {Confirm,Complete}.png
 *
 * The search runs on the server: an administrator looking up one account is
 * never handed the whole directory to filter in the browser.
 *
 * @param {'grant'|'revoke'|'both'} [focus]  Which action the page leads with —
 *   the sidebar has separate Grant Founder Access and Revoke Access entries.
 */
export default function RoleManagement({
  focus = 'both',
  query: initialQuery = '',
  searched: initialSearched = false,
  matched: matchedStudent = null,
  grants: foundersWithAccess = [],
  assignments: mobileRoleAssignments = [],
}) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [pending, setPending] = useState(null)
  const [done, setDone] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const searched = initialSearched

  function search(event) {
    event.preventDefault()
    const term = query.trim()
    router.push(term ? `?q=${encodeURIComponent(term)}` : '?')
  }

  async function confirm() {
    setSubmitting(true)
    try {
      if (pending.action === 'grant') {
        await api.post('/api/backend/access', { userId: pending.target.userId })
      } else {
        await api.delete('/api/backend/access', {
          body: pending.target.grantId
            ? { grantId: pending.target.grantId }
            : { userId: pending.target.userId },
        })
      }
      setDone(pending)
      setPending(null)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <SectionLabel>
          {focus === 'revoke' ? 'Revoke Founder Access' : 'Grant Founder Access'}
        </SectionLabel>
        <Card padding="lg" className="mt-3 px-6 py-6">
          <p className="text-sm text-muted">
            Search by App ID or name to find a student and{' '}
            {focus === 'revoke' ? 'revoke Founder access' : 'grant Founder access'}. This
            is triggered after an approved incubation application.
          </p>
          <form
            className="mt-4 flex gap-3"
            onSubmit={search}
          >
            <label htmlFor="role-search" className="sr-only">
              Search by name or App ID
            </label>
            <input
              id="role-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or App ID e.g. ATL-2024-0871..."
              className="h-11 w-full max-w-[430px] rounded-field border border-line bg-canvas px-3.5 text-sm text-ink placeholder:text-muted focus:border-primary-500 focus:bg-surface focus:outline-none"
            />
            <Button type="submit" size="xl">
              Search
            </Button>
          </form>
        </Card>

        {matchedStudent ? (
          <>
            <SectionLabel className="mt-5">Matched Student</SectionLabel>
            <Card padding="lg" className="mt-3 px-6 py-5">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar
                  initials={matchedStudent.initials}
                  tone={matchedStudent.tone}
                  shape="square"
                  size="xl"
                  className="size-[52px] text-base"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-ink">{matchedStudent.name}</p>
                  <p className="mt-0.5 text-[13px] text-muted">{matchedStudent.meta}</p>
                </div>
                <Button
                  size="xl"
                  disabled={matchedStudent.hasAccess}
                  onClick={() => setPending({ action: 'grant', target: matchedStudent })}
                >
                  {matchedStudent.hasAccess ? 'Access Granted' : 'Grant Founder Access'}
                </Button>
                <Button
                  variant="danger"
                  size="xl"
                  disabled={!matchedStudent.hasAccess}
                  onClick={() => setPending({ action: 'revoke', target: matchedStudent })}
                >
                  Revoke Access
                </Button>
              </div>
            </Card>
          </>
        ) : null}

        <SectionLabel className="mt-5">Current Founders With Access</SectionLabel>
        <Card padding="none" className="mt-3">
          <ul>
            {foundersWithAccess.map((founder, index) => (
              <li
                key={founder.id}
                className={
                  index < foundersWithAccess.length - 1
                    ? 'flex items-center gap-4 border-b border-line px-6 py-4'
                    : 'flex items-center gap-4 px-6 py-4'
                }
              >
                <Avatar
                  initials={founder.initials}
                  tone={founder.tone}
                  shape="square"
                  size="sm"
                />
                <p className="w-[190px] shrink-0 truncate text-[15px] font-bold text-ink">
                  {founder.name}
                </p>
                <p className="w-[130px] shrink-0 text-[13px] text-muted">
                  {founder.appId}
                </p>
                <p className="w-[110px] shrink-0 text-[13px] text-primary-text">
                  {founder.startup}
                </p>
                <p className="min-w-0 flex-1 truncate text-[13px] text-muted">
                  {founder.granted}
                </p>
                <Button
                  variant="reject"
                  size="sm"
                  disabled={founder.revoked}
                  onClick={() => setPending({ action: 'revoke', target: founder })}
                >
                  {founder.revoked ? 'Revoked' : 'Revoke'}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---- Mobile: role assignment list -------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {mobileRoleAssignments.map((user) => (
          <li key={user.id}>
            <Card padding="lg" className="flex items-center gap-3.5">
              <Avatar initials={user.initials} tone={user.tone} shape="square" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{user.name}</p>
                <p className="truncate text-[13px] text-muted">{user.role}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <ActionDialog
        open={pending?.action === 'grant'}
        onClose={() => setPending(null)}
        tone="primary"
        title="Grant Founder Access?"
        description="This applicant gains Founder access immediately — Hiring, Service, and startup listing management unlock. Their incubation application will be marked approved."
        confirmLabel="Yes, Grant Access"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />

      <ActionDialog
        open={pending?.action === 'revoke'}
        onClose={() => setPending(null)}
        tone="danger"
        title="Revoke Founder Access?"
        description="This founder will immediately lose access to Hiring, Service, and their startup listing, and revert to Standard Student. They'll need to re-apply for incubation to regain access."
        confirmLabel="Yes, Revoke Access"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />

      <ConfirmDialog
        open={Boolean(done)}
        onClose={() => setDone(null)}
        title={done?.action === 'grant' ? 'Founder Access Granted' : 'Founder Access Revoked'}
        description={
          done
            ? done.action === 'grant'
              ? `${done.target.name} now has Founder access and can manage ${done.target.startup} on the platform.`
              : `${done.target.name} has reverted to Standard Student. They have been notified.`
            : ''
        }
      />
    </>
  )
}
