'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { INCUBATION_APPLY_LIMITS } from '@/config/incubation-apply'
import { cn } from '@/lib/utils'
import { Field, FormError, PrivacyNote, Rule, SubmitButton } from './EnquiryFields'
import EnquirySuccess from './EnquirySuccess'

/**
 * The public "Apply for incubation" application.
 *
 * A separate component from the signed-in Founder form (`StartupListingForm`)
 * and a separate flow: it posts to `/api/landing/incubation-applications`,
 * which stores the application for a Forge Manager to review and creates no
 * account, startup or incubation record of its own. It collects the same
 * startup details and readiness items as the Founder form, plus the contact
 * details an applicant without an account must give, and deliberately NOT
 * Hiring status, Open roles or Team Members.
 *
 * The shell is its own too. `EnquirySheet` scrolls the whole overlay, which
 * is right for the two short enquiry forms; this form is several screens tall,
 * so here the header stays fixed and only the body scrolls, inside a panel
 * that never exceeds the viewport. `EnquirySheet` is unchanged.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/
const PHONE_ALLOWED = /^[0-9+()\-.\s]+$/
const LOGO_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp']

const ENDPOINT = '/api/landing/incubation-applications'

async function fetchOptions() {
  const response = await fetch(ENDPOINT, { cache: 'no-store' })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.ok) throw new Error('unavailable')
  return body.data
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Same contract as the platform's dialogs: Escape and the backdrop close, Tab
 * cycles inside, the page behind does not scroll, focus returns to the opener.
 */
function IncubationSheet({ open, onClose, labelledBy, children }) {
  const overlayRef = useRef(null)
  const panelRef = useRef(null)

  // Read through a ref so the effect below runs on open/close only. The form
  // re-renders on every keystroke; if a new `onClose` re-ran the effect, its
  // cleanup would restore focus and the setup would refocus the panel —
  // pulling the caret out of whatever field the visitor was typing in.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = panel.querySelectorAll(FOCUSABLE)
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    []
  )

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, handleKeyDown])

  /*
   * Pin the overlay to the VISUAL viewport. When anything on the page is wider
   * than a phone screen, mobile browsers widen the layout viewport to fit it,
   * and a `fixed inset-0` overlay stretches with it — pushing Close and the
   * right edge of every field off screen. Sizing from `visualViewport` keeps
   * the sheet exactly as wide as what the visitor can see. Written straight to
   * the element's style: it tracks the browser, not React state.
   */
  useEffect(() => {
    const viewport = window.visualViewport
    if (!open || !viewport) return undefined

    const fit = () => {
      const overlay = overlayRef.current
      if (!overlay) return
      overlay.style.left = `${viewport.offsetLeft}px`
      overlay.style.top = `${viewport.offsetTop}px`
      overlay.style.width = `${viewport.width}px`
      overlay.style.height = `${viewport.height}px`
      overlay.style.right = 'auto'
      overlay.style.bottom = 'auto'
    }

    fit()
    viewport.addEventListener('resize', fit)
    viewport.addEventListener('scroll', fit)
    return () => {
      viewport.removeEventListener('resize', fit)
      viewport.removeEventListener('scroll', fit)
    }
  }, [open])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-100 flex items-stretch justify-center bg-forge-ink/45 backdrop-blur-[2px] sm:items-center sm:p-4 lg:p-6"
      onMouseDown={(event) => {
        // mousedown, not click — see EnquirySheet: a text selection released
        // over the backdrop must not close the form and lose what was typed.
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-full max-w-[920px] flex-col overflow-hidden bg-[#f5f5f7]',
          'font-forge shadow-[0_32px_80px_-24px_rgb(26_20_80/0.45)] focus:outline-none',
          'sm:h-auto sm:max-h-full sm:rounded-[16px]'
        )}
      >
        {/* ---- Header strip: stays put while the body scrolls ------------ */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e2e1ec] bg-white px-5 py-3.5 sm:px-8 sm:py-4">
          <p className="text-[15px] font-bold text-forge-ink sm:text-[17px]">
            Atlas Forge Incubation
          </p>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 cursor-pointer rounded-md px-1 text-base font-normal text-forge-ink transition-opacity hover:opacity-60 sm:text-lg"
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-5 pb-7 sm:px-8 sm:pt-6 sm:pb-8">
          {children}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

function Required() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-forge-pink">
      *
    </span>
  )
}

function SectionHeading({ children }) {
  return (
    <h3 className="text-[13px] font-bold tracking-[0.09em] text-forge-ink uppercase">
      {children}
    </h3>
  )
}

function FieldError({ id, message }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-xs font-medium text-forge-pink">
      {message}
    </p>
  )
}

/**
 * Industry and Current Stage — a row of pills, the landing-page rendering of
 * the Founder form's segmented control. Native radios underneath, so arrow
 * keys, form semantics and screen readers all work without extra code.
 */
function ChoiceGroup({ legend, name, options, value, onChange, error }) {
  const errorId = useId()

  return (
    <fieldset
      className="flex flex-col gap-2"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : undefined}
    >
      <legend className="mb-2 text-[11px] leading-none font-bold tracking-[0.09em] text-[#1a1850] uppercase">
        {legend}
        <Required />
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.slug
          return (
            <label
              key={option.slug}
              className={cn(
                'inline-flex h-[38px] cursor-pointer items-center rounded-full border px-4 text-[13px] transition-colors',
                'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forge-purple',
                checked
                  ? 'border-forge-ink bg-forge-ink font-semibold text-white'
                  : 'border-[#dddcf0] bg-white text-forge-ink hover:border-forge-purple/60',
                error && !checked && 'border-forge-pink/60'
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.slug}
                checked={checked}
                onChange={() => onChange(option.slug)}
                className="sr-only"
              />
              {option.name}
            </label>
          )
        })}
      </div>
      <FieldError id={errorId} message={error} />
    </fieldset>
  )
}

/* -------------------------------------------------------------------------- */
/* Validation                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * The browser-side copy of the server's rules, so a visitor hears about a
 * problem before the round trip. The server applies the same rules again and
 * is the one that decides.
 */
function validate(values, readiness) {
  const errors = {}
  const text = (key) => String(values[key] ?? '').trim()

  if (text('fullName').length < 2) errors.fullName = 'Enter your full name.'

  if (!text('email')) errors.email = 'Email is required.'
  else if (!EMAIL_PATTERN.test(text('email'))) errors.email = 'Enter a valid email address.'

  const phone = text('phone')
  if (!phone) errors.phone = 'Phone number is required.'
  else if (!PHONE_ALLOWED.test(phone)) errors.phone = 'Use digits, spaces and + ( ) - only.'
  else {
    const digits = phone.replace(/\D/g, '').length
    if (digits < 7 || digits > 15) errors.phone = 'Enter a valid phone number.'
  }

  if (text('startupName').length < 2) errors.startupName = 'Enter your startup name.'
  if (!values.industrySlug) errors.industrySlug = 'Choose an industry.'
  if (!values.stageSlug) errors.stageSlug = 'Choose your current stage.'

  for (const item of readiness) {
    const value = text(item.field)
    if (item.required && !value) errors[item.field] = `${item.label} is required.`
    else if (value.length > item.maxLength) {
      errors[item.field] = `Keep this to ${item.maxLength} characters or fewer.`
    }
  }

  return errors
}

/** The fields in the order they appear, so focus lands on the first problem. */
const FIELD_ORDER = [
  'fullName',
  'email',
  'phone',
  'logo',
  'startupName',
  'tagline',
  'problemStatement',
  'industrySlug',
  'stageSlug',
  'pitchDeck',
  'productDemo',
  'productAssets',
  'keyPersonnel',
]

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

const EMPTY_VALUES = {
  industrySlug: '',
  stageSlug: '',
  pitchDeck: '',
  productDemo: '',
  productAssets: '',
  keyPersonnel: '',
}

export default function IncubationApplyModal({ open, onClose }) {
  const titleId = useId()
  const formRef = useRef(null)
  const logoInput = useRef(null)

  const [options, setOptions] = useState(null)
  const [optionsError, setOptionsError] = useState(null)

  const [values, setValues] = useState(EMPTY_VALUES)
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)
  const [pending, setPending] = useState(false)
  const [reference, setReference] = useState(null)

  // Fetched on first open, then kept: the choices are reference data. A
  // failure is shown with a retry, which clears the error and lands back here.
  useEffect(() => {
    if (!open || options || optionsError) return undefined

    let cancelled = false
    fetchOptions().then(
      (data) => !cancelled && setOptions(data),
      () =>
        !cancelled &&
        setOptionsError(
          'The application form could not be loaded. Check your connection and try again.'
        )
    )
    return () => {
      cancelled = true
    }
  }, [open, options, optionsError])

  // The preview is a local object URL; release it when it is replaced.
  useEffect(() => {
    if (!logoPreview) return undefined
    return () => URL.revokeObjectURL(logoPreview)
  }, [logoPreview])

  const readiness = options?.readiness ?? []
  const provided = readiness.filter((item) => String(values[item.field] ?? '').trim()).length

  function setValue(field, value) {
    setValues((previous) => ({ ...previous, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((previous) => {
        const next = { ...previous }
        delete next[field]
        return next
      })
    }
  }

  function clearLogo() {
    setLogoFile(null)
    setLogoPreview(null)
  }

  /** Puts the form back to blank, so reopening never shows the last application. */
  function close() {
    onClose?.()
    // After the panel has gone, so the visitor never sees the form flash empty.
    setTimeout(() => {
      setReference(null)
      setValues(EMPTY_VALUES)
      clearLogo()
      setFieldErrors({})
      setFormError(null)
      formRef.current?.reset()
      setOptionsError(null)
    }, 200)
  }

  /**
   * Checked here only to answer instantly — the server reads the file's bytes
   * and is the one that decides.
   */
  function handleLogoChange(event) {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still fires `change`.
    event.target.value = ''
    if (!file || !options) return

    const { accept, formats, maxBytes } = options.logoUpload
    const extension = file.name.split('.').pop()?.toLowerCase()

    let error = null
    if (!LOGO_EXTENSIONS.includes(extension) || !accept.split(',').includes(file.type)) {
      error = `That file is not a supported image. Use ${formats}.`
    } else if (file.size > maxBytes) {
      error = `That image is too large. The limit is ${Math.round(maxBytes / (1024 * 1024))}MB.`
    } else if (file.size === 0) {
      error = 'That file is empty.'
    }

    if (error) {
      clearLogo()
      setFieldErrors((previous) => ({ ...previous, logo: error }))
      return
    }

    setFieldErrors((previous) => {
      const next = { ...previous }
      delete next.logo
      return next
    })
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function focusFirstError(errors) {
    const first = FIELD_ORDER.find((field) => errors[field])
    if (!first) return
    const form = formRef.current
    const target =
      first === 'logo'
        ? form?.querySelector('[data-logo-trigger]')
        : form?.querySelector(`[name="${first}"]`)
    target?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!options || pending) return

    const data = new FormData(event.currentTarget)
    const text = {
      fullName: data.get('fullName'),
      email: data.get('email'),
      phone: data.get('phone'),
      startupName: data.get('startupName'),
      tagline: data.get('tagline'),
      problemStatement: data.get('problemStatement'),
    }
    const all = { ...text, ...values }

    const errors = validate(all, readiness)
    if (fieldErrors.logo) errors.logo = fieldErrors.logo
    setFormError(null)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      focusFirstError(errors)
      return
    }
    setFieldErrors({})

    const body = new FormData()
    for (const [key, value] of Object.entries(all)) body.append(key, String(value ?? '').trim())
    if (logoFile) body.append('logo', logoFile)

    setPending(true)
    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        body,
      })
      const result = await response.json().catch(() => null)

      if (response.ok && result?.ok) {
        setReference(result.data.reference)
        return
      }

      const fields = result?.error?.details?.fields
      if (fields) {
        setFieldErrors(fields)
        focusFirstError(fields)
      } else {
        setFormError(
          response.status === 413
            ? 'The application is too large. The logo limit is 2MB.'
            : (result?.error?.message ?? 'Something went wrong. Please try again.')
        )
      }
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  const errorId = (field) => (fieldErrors[field] ? `${titleId}-${field}-error` : undefined)

  return (
    <IncubationSheet open={open} onClose={close} labelledBy={titleId}>
      {reference ? (
        <EnquirySuccess
          titleId={titleId}
          heading="Application"
          accent="Received"
          message={
            <>
              Thank you — your incubation application has reached the ATLAS Forge team. Your
              reference is <strong className="font-bold text-forge-ink">{reference}</strong>.
              Our team generally responds with a decision or next step within one week.
            </>
          }
          onClose={close}
        />
      ) : (
        <>
          <h2
            id={titleId}
            className="text-[32px] leading-[0.96] font-bold tracking-[-0.02em] text-forge-ink sm:text-[38px] lg:text-[42px]"
          >
            Apply for
            <br />
            <span className="text-forge-pink">Incubation</span>
          </h2>

          <p className="mt-3 max-w-[600px] text-[13.5px] leading-[19px] text-[#4b4a63]">
            Tell us about you and what you&rsquo;re building. Fields marked{' '}
            <span className="text-forge-pink">*</span> are required. Our team reviews every
            application.
          </p>

          <Rule className="mt-5" />

          {!options ? (
            <div className="py-10 text-center" aria-live="polite">
              {optionsError ? (
                <div className="flex flex-col items-center gap-4">
                  <FormError message={optionsError} />
                  <button
                    type="button"
                    onClick={() => setOptionsError(null)}
                    className="inline-flex h-[46px] min-w-[176px] cursor-pointer items-center justify-center rounded-[8px] bg-[#3d3a8c] px-7 text-[12px] font-semibold tracking-[0.11em] text-white uppercase transition-colors duration-150 hover:bg-forge-ink"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <p className="text-[13.5px] text-[#6c6b80]">Loading the application form…</p>
              )}
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSubmit} noValidate className="mt-5">
              {/* ---- About you ------------------------------------------ */}
              <SectionHeading>About You</SectionHeading>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field
                  label={
                    <>
                      Full Name
                      <Required />
                    </>
                  }
                  name="fullName"
                  autoComplete="name"
                  required
                  maxLength={INCUBATION_APPLY_LIMITS.fullName}
                  placeholder="Your full name"
                  error={fieldErrors.fullName}
                />
                <Field
                  label={
                    <>
                      Email
                      <Required />
                    </>
                  }
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={INCUBATION_APPLY_LIMITS.email}
                  placeholder="you@company.com"
                  error={fieldErrors.email}
                />
                <Field
                  label={
                    <>
                      Phone Number
                      <Required />
                    </>
                  }
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  maxLength={INCUBATION_APPLY_LIMITS.phone}
                  placeholder="+91"
                  error={fieldErrors.phone}
                />
              </div>

              <Rule className="mt-6" />

              {/* ---- Your startup --------------------------------------- */}
              <div className="mt-5">
                <SectionHeading>Your Startup</SectionHeading>

                <div className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[11px] leading-none font-bold tracking-[0.09em] text-[#1a1850] uppercase">
                    Startup Logo
                  </span>
                  <div className="mt-1 flex flex-wrap items-center gap-4">
                    <span
                      aria-hidden="true"
                      className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#dddcf0] bg-white text-[18px] font-bold text-forge-ink/40"
                    >
                      {logoPreview ? (
                        // A local object URL for a file not yet uploaded, so
                        // next/image (which needs a known remote) does not apply.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={logoPreview} alt="" className="size-full object-cover" />
                      ) : (
                        'Logo'
                      )}
                    </span>
                    <div className="min-w-0">
                      <input
                        ref={logoInput}
                        type="file"
                        name="logo"
                        aria-label="Startup Logo"
                        accept={options.logoUpload.accept}
                        onChange={handleLogoChange}
                        tabIndex={-1}
                        className="sr-only"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          data-logo-trigger
                          onClick={() => logoInput.current?.click()}
                          aria-describedby={errorId('logo')}
                          className="inline-flex h-[40px] cursor-pointer items-center rounded-[8px] border border-[#dddcf0] bg-white px-4 text-[13px] font-semibold text-forge-ink transition-colors hover:border-forge-purple/60"
                        >
                          {logoFile ? 'Replace Logo' : 'Upload Logo'}
                        </button>
                        {logoFile ? (
                          <button
                            type="button"
                            onClick={clearLogo}
                            className="cursor-pointer px-2 text-[13px] text-[#6c6b80] underline-offset-2 hover:underline"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-1.5 text-[12px] text-[#6c6b80]">
                        {logoFile ? `${logoFile.name} · ` : ''}
                        {options.logoUpload.formats} · up to{' '}
                        {Math.round(options.logoUpload.maxBytes / (1024 * 1024))}MB
                      </p>
                    </div>
                  </div>
                  <FieldError id={errorId('logo')} message={fieldErrors.logo} />
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Field
                    label={
                      <>
                        Startup Name
                        <Required />
                      </>
                    }
                    name="startupName"
                    required
                    maxLength={INCUBATION_APPLY_LIMITS.startupName}
                    placeholder="e.g. NovaMed — AI health monitoring"
                    error={fieldErrors.startupName}
                  />
                  <Field
                    label="Tagline"
                    name="tagline"
                    maxLength={INCUBATION_APPLY_LIMITS.tagline}
                    placeholder="One line describing what you do"
                    error={fieldErrors.tagline}
                  />
                </div>

                <div className="mt-4">
                  <Field
                    label="Problem Statement"
                    as="textarea"
                    name="problemStatement"
                    maxLength={INCUBATION_APPLY_LIMITS.problemStatement}
                    placeholder="What problem are you solving and for whom?"
                    error={fieldErrors.problemStatement}
                  />
                </div>

                <div className="mt-5 grid gap-5">
                  <ChoiceGroup
                    legend="Industry"
                    name="industrySlug"
                    options={options.industries}
                    value={values.industrySlug}
                    onChange={(slug) => setValue('industrySlug', slug)}
                    error={fieldErrors.industrySlug}
                  />
                  <ChoiceGroup
                    legend="Current Stage"
                    name="stageSlug"
                    options={options.stages}
                    value={values.stageSlug}
                    onChange={(slug) => setValue('stageSlug', slug)}
                    error={fieldErrors.stageSlug}
                  />
                </div>
              </div>

              <Rule className="mt-6" />

              {/* ---- Readiness ------------------------------------------ */}
              <div className="mt-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <SectionHeading>Startup Readiness</SectionHeading>
                    <p className="mt-1.5 text-[12.5px] text-[#6c6b80]">
                      Paste a link or add details for each item.
                    </p>
                  </div>
                  <p className="text-[12px] font-semibold text-forge-ink" aria-live="polite">
                    {provided} of {readiness.length} provided
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e1ec]"
                >
                  <div
                    className="h-full rounded-full bg-forge-purple transition-[width] duration-300"
                    style={{
                      width: `${readiness.length ? Math.round((provided / readiness.length) * 100) : 0}%`,
                    }}
                  />
                </div>

                <div className="mt-4 grid gap-3">
                  {readiness.map((item) => {
                    const value = values[item.field] ?? ''
                    const done = Boolean(value.trim())
                    const inputId = `${titleId}-${item.field}`
                    const hintId = `${inputId}-hint`
                    const error = fieldErrors[item.field]
                    const control = cn(
                      'mt-3 w-full rounded-[8px] border bg-white px-3.5 text-[14px] text-forge-ink',
                      'transition-colors duration-150 placeholder:text-[#a8a7bb]',
                      'hover:border-forge-purple/60 focus:border-forge-purple focus:outline-none',
                      error ? 'border-forge-pink focus:border-forge-pink' : 'border-[#dddcf0]'
                    )
                    const shared = {
                      id: inputId,
                      name: item.field,
                      value,
                      maxLength: item.maxLength,
                      required: item.required,
                      'aria-required': item.required || undefined,
                      'aria-invalid': error ? true : undefined,
                      'aria-describedby': [hintId, errorId(item.field)].filter(Boolean).join(' '),
                      onChange: (event) => setValue(item.field, event.target.value),
                    }

                    return (
                      <div
                        key={item.field}
                        className={cn(
                          'rounded-[12px] border bg-white p-4',
                          error ? 'border-forge-pink/50' : 'border-[#e2e1ec]'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className={cn(
                              'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]',
                              done
                                ? 'border-forge-purple bg-forge-purple text-white'
                                : 'border-[#cfcde3] bg-white'
                            )}
                          >
                            {done ? '✓' : ''}
                          </span>
                          <div className="min-w-0 flex-1">
                            <label
                              htmlFor={inputId}
                              className="text-[14px] font-bold text-forge-ink"
                            >
                              {item.label}
                              {item.required ? (
                                <Required />
                              ) : (
                                <span className="ml-1.5 text-[12px] font-normal text-[#8f8ea6]">
                                  Optional
                                </span>
                              )}
                            </label>
                            <p id={hintId} className="mt-0.5 text-[12.5px] text-[#6c6b80]">
                              {item.hint}
                            </p>
                            {item.field === 'keyPersonnel' ? (
                              <textarea
                                rows={3}
                                placeholder="Names, roles and what each person owns"
                                className={cn(control, 'resize-y py-2.5')}
                                {...shared}
                              />
                            ) : (
                              <input
                                type="text"
                                placeholder="Paste link or add details..."
                                className={cn(control, 'h-[42px]')}
                                {...shared}
                              />
                            )}
                            <div className="mt-1.5">
                              <FieldError id={errorId(item.field)} message={error} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {formError ? (
                <div className="mt-5">
                  <FormError message={formError} />
                </div>
              ) : null}

              <Rule className="mt-6" />

              <div className="mt-4">
                <PrivacyNote />
              </div>

              <div className="mt-4">
                <SubmitButton pending={pending} pendingLabel="Submitting…">
                  Submit Application
                </SubmitButton>
              </div>
            </form>
          )}
        </>
      )}
    </IncubationSheet>
  )
}
