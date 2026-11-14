'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ActionDialog, Button, Card, SectionLabel } from '@/components/ui'
import { api } from '@/lib/api/client'

const STAFF_ROLES = ['forge-manager', 'backend-manager', 'super-admin']
const ATLAS_DOMAIN = '@atlasuniversity.edu.in'

/**
 * Backend Manager: change the matched account's role.
 *
 * One user = one role — choosing a new role REPLACES the current one. The
 * server is the authority for every rule (staff roles need an Atlas email, you
 * cannot change your own role, the last Backend Manager cannot be moved); the
 * hint below only saves a round trip.
 */
export default function ChangeRolePanel({ user, roleOptions = [] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [role, setRole] = useState(user.roleSlug ?? '')
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  const label = (slug) => roleOptions.find((option) => option.value === slug)?.label ?? slug
  const unchanged = !role || role === user.roleSlug
  const needsAtlasEmail =
    STAFF_ROLES.includes(role) && !String(user.email ?? '').toLowerCase().endsWith(ATLAS_DOMAIN)

  async function confirm() {
    setSubmitting(true)
    setMessage(null)
    try {
      await api.patch('/api/backend/users', { userId: user.userId, role })
      setMessage({ tone: 'ok', text: `${user.name} is now a ${label(role)}.` })
      startTransition(() => router.refresh())
    } catch (error) {
      setMessage({ tone: 'error', text: error.message })
    } finally {
      setSubmitting(false)
      setConfirming(false)
    }
  }

  return (
    <>
      <SectionLabel className="mt-5">Change Role</SectionLabel>
      <Card padding="lg" className="mt-3 px-6 py-5">
        <p className="text-sm text-muted">
          Each account has exactly one role. Choosing a new role replaces{' '}
          <strong className="text-ink">{label(user.roleSlug) || 'no role'}</strong>.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label htmlFor="change-role" className="sr-only">
            New role
          </label>
          <select
            id="change-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="h-11 rounded-field border border-line bg-canvas px-3.5 text-sm text-ink focus:border-primary-500 focus:outline-none"
          >
            <option value="" disabled>
              Choose a role…
            </option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button
            size="xl"
            disabled={unchanged || needsAtlasEmail || submitting}
            onClick={() => setConfirming(true)}
          >
            Change Role
          </Button>
        </div>
        {needsAtlasEmail ? (
          <p className="mt-3 text-[13px] text-danger-text" role="alert">
            Staff roles need an {ATLAS_DOMAIN} email. This account uses {user.email}.
          </p>
        ) : null}
        {message ? (
          <p
            className={`mt-3 text-[13px] ${message.tone === 'ok' ? 'text-success-text' : 'text-danger-text'}`}
            role={message.tone === 'ok' ? 'status' : 'alert'}
          >
            {message.text}
          </p>
        ) : null}
      </Card>

      <ActionDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        tone="primary"
        title={`Make ${user.name} a ${label(role)}?`}
        description={`Their current role (${label(user.roleSlug) || 'none'}) is removed and replaced by ${label(role)}. They will see the ${label(role)} dashboard the next time they open a page.`}
        confirmLabel="Yes, Change Role"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />
    </>
  )
}
