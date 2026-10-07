'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, FormField } from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Forced first-login password change.
 *
 * Posts to the existing POST /api/auth/password, which verifies the current
 * (temporary) password, stores only the scrypt hash of the new one and clears
 * the `must_change_password` flag. On success the account is no longer held on
 * this screen, so we send it on to pick its role / land on its home.
 */
export default function ChangePasswordForm() {
  const router = useRouter()
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      setFormError(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const next = {}
    if (!values.currentPassword) next.currentPassword = 'Enter your current password.'
    if (values.newPassword.length < 8) next.newPassword = 'Use at least 8 characters.'
    if (values.newPassword === values.currentPassword) {
      next.newPassword = 'Choose a password you have not used here.'
    }
    if (values.confirmPassword !== values.newPassword) {
      next.confirmPassword = 'The passwords do not match.'
    }
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await api.post('/api/auth/password', values)
      // The forced-change flag is now cleared; the guard will let the user
      // through. select-role sends a single-role member straight to its home.
      router.replace('/select-role')
      router.refresh()
    } catch (error) {
      setFormError(error.message)
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
      <FormField
        label="Current (temporary) password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        placeholder="The password you were given"
        value={values.currentPassword}
        onChange={update('currentPassword')}
        error={errors.currentPassword}
        required
        requiredMark={false}
      />
      <FormField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use at least 8 characters."
        value={values.newPassword}
        onChange={update('newPassword')}
        error={errors.newPassword}
        required
        requiredMark={false}
      />
      <FormField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        placeholder="Re-enter your new password"
        value={values.confirmPassword}
        onChange={update('confirmPassword')}
        error={errors.confirmPassword}
        required
        requiredMark={false}
      />

      {formError ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {formError}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={submitting} className="h-12 text-[15px]">
        {submitting ? 'Updating…' : 'Set new password'}
      </Button>
    </form>
  )
}
