'use client'

import { useId, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * The form controls drawn in the two landing sheets.
 *
 * Reference: /reference/landing-page/services.png (labels 11px uppercase,
 * white fields on the #F5F5F7 body, 1px #DDDCF0 border, ~8px radius) and
 * /reference/landing-page/Service required drop down.png for the picker.
 *
 * These are separate from `@/components/ui` FormField, which draws the
 * platform's filled `#F7F8FC` control with a sentence-case label — a different
 * control, still used unchanged by every signed-in screen.
 */

const CONTROL =
  'w-full rounded-[8px] border border-[#dddcf0] bg-white px-3.5 text-[14px] text-forge-ink ' +
  'transition-colors duration-150 placeholder:text-[#a8a7bb] ' +
  'hover:border-forge-purple/60 focus:border-forge-purple focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

function Label({ htmlFor, children }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[11px] leading-none font-bold tracking-[0.09em] text-[#1a1850] uppercase"
    >
      {children}
    </label>
  )
}

/**
 * @param {'input'|'textarea'|'select'} [props.as]
 * @param {string} [props.error]  Server-reported message for this field.
 */
export function Field({
  label,
  as = 'input',
  error,
  className,
  containerClassName,
  children,
  ...props
}) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  const shared = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': errorId,
    className: cn(
      CONTROL,
      as !== 'textarea' && 'h-[44px]',
      error && 'border-forge-pink focus:border-forge-pink',
      className
    ),
    ...props,
  }

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      <Label htmlFor={id}>{label}</Label>

      {as === 'textarea' ? (
        <textarea rows={3} {...shared} className={cn(shared.className, 'resize-y py-2.5')} />
      ) : as === 'select' ? (
        // `appearance-none` plus the chevron below: a native select is kept
        // (it is the right control on a phone) but the OS arrow is replaced
        // with the one the reference draws.
        //
        // `:has(option[value=""]:checked)` tints the closed control while the
        // empty option is the selected one, so an untouched picker reads as
        // placeholder text — grey, like every other field — rather than as an
        // answer the visitor has already given.
        <div className="relative">
          <select
            {...shared}
            className={cn(
              shared.className,
              'appearance-none pr-11',
              'has-[option[value=""]:checked]:text-[#a8a7bb]'
            )}
          >
            {children}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#8f8ea6]"
          >
            <path
              d="M5 8l5 5 5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ) : (
        <input {...shared} />
      )}

      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-forge-pink">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** The hairline rules above the fields and above the privacy note. */
export function Rule({ className }) {
  return <hr className={cn('border-0 border-t border-[#e2e1ec]', className)} />
}

export function PrivacyNote() {
  return (
    <p className="text-[12px] leading-[16px] text-[#6c6b80]">
      We use the information you provide only to respond to your enquiry and route it to the
      appropriate ATLAS Forge team.
    </p>
  )
}

export function SubmitButton({ pending, children, pendingLabel = 'Sending…' }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex h-[46px] min-w-[176px] items-center justify-center rounded-[8px] px-7',
        'bg-[#3d3a8c] text-[12px] font-semibold tracking-[0.11em] text-white uppercase',
        'transition-colors duration-150 hover:bg-forge-ink',
        'disabled:cursor-not-allowed disabled:opacity-70'
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  )
}

/**
 * The banner shown when the whole submission failed rather than one field —
 * a duplicate, a throttle, or the server being unreachable.
 */
export function FormError({ message }) {
  if (!message) return null
  return (
    <p
      role="alert"
      className="rounded-[8px] border border-forge-pink/35 bg-forge-pink/8 px-4 py-3 text-[13px] leading-[18px] font-medium text-forge-pink"
    >
      {message}
    </p>
  )
}

/**
 * Posts a landing form and reports back what happened.
 *
 * Field errors arrive from the server as `error.details.fields`, keyed by the
 * same names the inputs use, so a 422 lights up the offending controls rather
 * than showing one generic line. The browser's own `required`/`type=email`
 * checks still run first — they are the fast path, not the guarantee.
 */
export function useEnquirySubmit(endpoint) {
  const [pending, setPending] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState(null)

  const reset = () => {
    setFieldErrors({})
    setFormError(null)
  }

  async function submit(payload) {
    setPending(true)
    reset()

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      let body = null
      try {
        body = await response.json()
      } catch {
        /* a non-JSON body is handled by the `!ok` branch below */
      }

      if (response.ok && body?.ok) return true

      setFieldErrors(body?.error?.details?.fields ?? {})
      setFormError(
        body?.error?.details?.fields
          ? null
          : (body?.error?.message ?? 'Something went wrong. Please try again.')
      )
      return false
    } catch {
      // Offline, DNS, a dropped connection — never a validation problem, so it
      // is reported as a whole-form failure rather than against a field.
      setFormError('Could not reach the server. Check your connection and try again.')
      return false
    } finally {
      setPending(false)
    }
  }

  return { submit, pending, fieldErrors, formError, reset }
}
