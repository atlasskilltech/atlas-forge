'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Card, FormField, Modal, SectionLabel } from '@/components/ui'
import { api, ApiError } from '@/lib/api/client'

/**
 * Create Staff User — the Backend Manager's account-provisioning form.
 *
 * The role dropdown is driven by `roles` from the server (the roles lookup
 * filtered to the administrative roles), so a rename in reference data flows
 * through without a code change here.
 *
 * The password field is optional. Left blank, the server generates a strong
 * temporary password and returns it once; this component then shows it in a
 * dialog with a copy button, because it is the only time it will ever be
 * visible — only the hash is stored.
 *
 * @param {Array<{value:string,label:string}>} roles  Assignable staff roles.
 */
export default function CreateStaffUser({ roles = [] }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const empty = { name: '', email: '', role: roles[0]?.value ?? '', password: '' }
  const [form, setForm] = useState(empty)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (fieldErrors[field]) setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function submit(event) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const account = await api.post('/api/backend/users', {
        name: form.name,
        email: form.email,
        role: form.role,
        // Only send a password when one was actually typed.
        ...(form.password ? { password: form.password } : {}),
      })
      setCreated(account)
      setForm(empty)
      startTransition(() => router.refresh())
    } catch (error) {
      if (error instanceof ApiError && error.isValidation && Object.keys(error.fields).length) {
        setFieldErrors(error.fields)
      } else {
        setFormError(
          error instanceof ApiError
            ? error.message
            : 'Could not create the account. Please try again.'
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  async function copyPassword() {
    if (!created?.temporaryPassword) return
    try {
      await navigator.clipboard.writeText(created.temporaryPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard can be blocked; the value is visible to copy by hand */
    }
  }

  return (
    <>
      <SectionLabel>New Staff Account</SectionLabel>
      <Card padding="lg" className="mt-3 max-w-[560px] px-6 py-6">
        <p className="text-sm text-muted">
          Create an account for a Forge Manager, Backend Manager or Super Admin. The account is
          active immediately and signs in with the email below.
        </p>

        <form className="mt-5 flex flex-col gap-4" onSubmit={submit} noValidate>
          <FormField
            label="Full name"
            name="name"
            autoComplete="off"
            required
            value={form.name}
            error={fieldErrors.name}
            onChange={(event) => set('name', event.target.value)}
            placeholder="e.g. Dr. Meera Joshi"
          />

          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="off"
            required
            value={form.email}
            error={fieldErrors.email}
            onChange={(event) => set('email', event.target.value)}
            placeholder="name@atlasuniversity.edu.in"
          />

          <FormField
            label="Role"
            as="select"
            name="role"
            required
            value={form.role}
            error={fieldErrors.role}
            onChange={(event) => set('role', event.target.value)}
            options={roles}
          />

          <FormField
            label="Temporary password"
            name="password"
            type="text"
            autoComplete="off"
            requiredMark={false}
            value={form.password}
            error={fieldErrors.password}
            onChange={(event) => set('password', event.target.value)}
            hint="Leave blank to generate a strong password you can hand over."
            placeholder="Leave blank to auto-generate"
          />

          {formError ? (
            <p role="alert" className="text-sm font-medium text-danger">
              {formError}
            </p>
          ) : null}

          <div className="mt-1 flex justify-end">
            <Button type="submit" size="xl" disabled={submitting || roles.length === 0}>
              {submitting ? 'Creating…' : 'Create Staff User'}
            </Button>
          </div>
        </form>
      </Card>

      <Modal
        open={Boolean(created)}
        onClose={() => setCreated(null)}
        showClose
        title="Staff account created"
        description={
          created
            ? `${created.name} can now sign in as ${created.role?.name}.`
            : undefined
        }
      >
        {created ? (
          <div className="mt-5 flex flex-col gap-3">
            <CredentialRow label="App ID" value={created.appId} />
            <CredentialRow label="Email" value={created.email} />

            {created.temporaryPassword ? (
              <>
                <div className="rounded-field border border-line bg-canvas px-3.5 py-3">
                  <p className="text-[13px] font-semibold text-ink">Temporary password</p>
                  <p className="mt-1 font-mono text-sm break-all text-ink">
                    {created.temporaryPassword}
                  </p>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-3"
                    onClick={copyPassword}
                  >
                    {copied ? 'Copied' : 'Copy password'}
                  </Button>
                </div>
                <p className="text-xs text-muted">
                  Shown once — copy it now and share it securely. Ask the user to change it after
                  their first sign-in.
                </p>
              </>
            ) : (
              <p className="text-xs text-muted">
                The account uses the password you set. Share it securely.
              </p>
            )}

            <Button className="mt-2 h-11" fullWidth onClick={() => setCreated(null)}>
              Done
            </Button>
          </div>
        ) : null}
      </Modal>
    </>
  )
}

function CredentialRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-field border border-line bg-canvas px-3.5 py-2.5">
      <span className="text-[13px] font-semibold text-muted">{label}</span>
      <span className="truncate text-sm font-semibold text-ink">{value}</span>
    </div>
  )
}
