'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, FormField } from '@/components/ui'

/**
 * Sign-in form shared by the mobile card and the desktop panel.
 *
 * Reference: /reference/mast ui/Login Screen.png (input 560x48, button 560x52)
 *            /reference/mast phone ui/Login Screen.png (input 310x44, button 310x48)
 *
 * Frontend-only for now: it validates the two fields and routes to role
 * selection. The real credential check arrives with the API section.
 */
export default function LoginForm() {
  const router = useRouter()
  const [values, setValues] = useState({ appId: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  function update(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!values.appId.trim()) nextErrors.appId = 'Enter your App ID.'
    if (!values.password) nextErrors.password = 'Enter your password.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    router.push('/select-role')
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 lg:mt-6">
      <div className="space-y-4 lg:space-y-6">
        <FormField
          label="Email / App ID"
          name="appId"
          autoComplete="username"
          placeholder="e.g. ATL-2024-0871"
          size="responsive"
          value={values.appId}
          onChange={update('appId')}
          error={errors.appId}
          required
          requiredMark={false}
        />
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          size="responsive"
          value={values.password}
          onChange={update('password')}
          error={errors.password}
          required
          requiredMark={false}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={submitting}
        className="mt-4 h-12 text-[15px] lg:mt-6 lg:h-13 lg:text-base"
      >
        {submitting ? 'Signing in…' : 'Sign In'}
      </Button>
    </form>
  )
}
