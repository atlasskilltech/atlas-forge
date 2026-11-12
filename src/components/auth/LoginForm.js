'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button, FormField } from '@/components/ui'
import { api } from '@/lib/api/client'

/** The Google "G" mark, drawn inline so it needs no network request. */
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  )
}

/**
 * Sign-in form shared by the mobile card and the desktop panel.
 *
 * Reference: /reference/mast ui/Login Screen.png (input 560x48, button 560x52)
 *            /reference/mast phone ui/Login Screen.png (input 310x44, button 310x48)
 *
 * Credentials are checked by POST /api/auth/login, which sets an httpOnly
 * session cookie. The password never leaves this component except in that one
 * request body, and no part of the identity is stored in the browser.
 */
export default function LoginForm({ googleEnabled = false, googleError = null, googleNext = null }) {
  const router = useRouter()
  const [values, setValues] = useState({ appId: '', password: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  // The Google button is a plain anchor — a full navigation, so the browser
  // follows the server redirect out to Google. `googleNext` is the already
  // same-site-validated `?next=` from the login page's own query, carried through
  // the OAuth round-trip so a deep link survives sign-in.
  const googleHref = googleNext
    ? `/api/auth/google/start?next=${encodeURIComponent(googleNext)}`
    : '/api/auth/google/start'

  function update(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextErrors = {}
    if (!values.appId.trim()) nextErrors.appId = 'Enter your App ID.'
    if (!values.password) nextErrors.password = 'Enter your password.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await api.post('/api/auth/login', {
        appId: values.appId.trim(),
        password: values.password,
      })

      // Read at submit time rather than with useSearchParams, which would opt
      // the whole login page out of static rendering for a value only ever
      // needed once, in the browser, on this click.
      const next = new URLSearchParams(window.location.search).get('next')
      // Honour ?next= only when it is a path on this site, so the parameter
      // cannot be used to bounce a signed-in user to another domain.
      const destination =
        next && next.startsWith('/') && !next.startsWith('//') ? next : '/select-role'

      router.replace(destination)
      router.refresh()
    } catch (error) {
      // The server deliberately does not say which field was wrong.
      setErrors({ password: error.message })
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mt-3 lg:mt-6">
      {googleError ? (
        <p
          role="alert"
          className="mb-4 rounded-field border border-danger-fill/30 bg-danger-fill/8 px-3.5 py-2.5 text-[13px] leading-snug text-danger lg:mb-6"
        >
          {googleError}
        </p>
      ) : null}

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

      {googleEnabled ? (
        <>
          <div className="my-4 flex items-center gap-3 lg:my-6" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            <span className="text-xs font-medium text-muted">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            as="a"
            href={googleHref}
            variant="secondary"
            fullWidth
            leadingIcon={<GoogleGlyph />}
            className="h-12 text-[15px] lg:h-13 lg:text-base"
          >
            Continue with Google
          </Button>
        </>
      ) : null}
    </form>
  )
}
