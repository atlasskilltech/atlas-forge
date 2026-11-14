'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, Card, Modal, SectionLabel } from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Backend Manager: PERMANENTLY delete the matched account.
 *
 * Two steps: "Delete user…" loads a read-only preview of everything that will
 * be removed; the delete button only unlocks once the manager has typed the
 * user's email. The server re-checks the email and every other rule (not
 * yourself, not the last Backend Manager) and runs the delete in one
 * transaction — this screen is a convenience, not the safety boundary.
 */
export default function DeleteUserPanel({ user }) {
  const router = useRouter()
  const [preview, setPreview] = useState(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const matches = typed.trim().toLowerCase() === String(user.email ?? '').trim().toLowerCase()

  async function openPreview() {
    setBusy(true)
    setError(null)
    try {
      const data = await api.get(`/api/backend/users/delete-preview?userId=${encodeURIComponent(user.userId)}`)
      setTyped('')
      setPreview(data)
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    setBusy(true)
    setError(null)
    try {
      await api.delete('/api/backend/users', { body: { userId: user.userId, confirmEmail: typed } })
      setPreview(null)
      router.push('/backend/users')
      router.refresh()
    } catch (caught) {
      setError(caught.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SectionLabel className="mt-5">Delete User</SectionLabel>
      <Card padding="lg" className="mt-3 px-6 py-5">
        <p className="text-sm text-muted">
          Permanently removes this account and its data from the database. There is no backup and
          no undo.
        </p>
        <div className="mt-4">
          <Button variant="danger" size="xl" disabled={busy} onClick={openPreview}>
            Delete User…
          </Button>
        </div>
        {error && !preview ? (
          <p className="mt-3 text-[13px] text-danger-text" role="alert">
            {error}
          </p>
        ) : null}
      </Card>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        size="md"
        title={`Permanently delete ${user.name}?`}
        description="This cannot be undone. The following will be removed from the database:"
      >
        {preview ? (
          <div className="mt-4 text-sm text-ink">
            <p className="font-bold">
              {preview.user.name} · {preview.user.appId} · {preview.user.email}
            </p>
            <ul className="mt-3 max-h-56 list-disc space-y-1 overflow-y-auto pl-5">
              <li>The user account itself</li>
              {preview.removed.map((item) => (
                <li key={item.key}>
                  {item.label}: <strong>{item.count}</strong>
                </li>
              ))}
            </ul>
            {preview.startupsKeptWithoutOwner > 0 ? (
              <p className="mt-3 text-muted">
                Kept: {preview.startupsKeptWithoutOwner} startup(s) they own stay on the platform
                with no owner.
              </p>
            ) : null}
            {preview.blocked ? (
              <p className="mt-3 text-danger-text" role="alert">
                {preview.blocked}
              </p>
            ) : (
              <>
                <label htmlFor="confirm-delete-email" className="mt-4 block font-bold">
                  Type the user’s email to confirm
                </label>
                <input
                  id="confirm-delete-email"
                  type="email"
                  autoComplete="off"
                  value={typed}
                  onChange={(event) => setTyped(event.target.value)}
                  placeholder={preview.user.email}
                  className="mt-2 h-11 w-full rounded-field border border-line bg-canvas px-3.5 text-sm text-ink focus:border-danger-fill focus:outline-none"
                />
              </>
            )}
            {error ? (
              <p className="mt-3 text-[13px] text-danger-text" role="alert">
                {error}
              </p>
            ) : null}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="h-11 flex-[2]" onClick={() => setPreview(null)}>
                Cancel
              </Button>
              <Button
                variant="dangerSolid"
                className="h-11 flex-[3]"
                disabled={busy || !matches || Boolean(preview.blocked)}
                onClick={confirmDelete}
              >
                Delete Permanently
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  )
}
