'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/phone components/FormField/Mobile.png (358x65)
 *            /reference/mast ui/Login Screen.png (input 560x46)
 *
 * Label above a #F7F8FC filled control with a hairline border and 10px radius.
 * FormField owns label/description/error wiring so every form screen stays
 * accessible without repeating aria plumbing.
 */

const CONTROL_BASE =
  'w-full rounded-field border border-line bg-canvas px-3.5 text-sm text-ink ' +
  'transition-colors duration-150 placeholder:text-muted ' +
  'hover:border-primary-300 focus:border-primary-500 focus:bg-surface focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

/** md = 44px (mobile forms) · lg = 48px (desktop login). Both measured. */
const CONTROL_HEIGHT = {
  md: 'h-11',
  lg: 'h-12',
  responsive: 'h-11 lg:h-12',
}

function Label({ htmlFor, children, mark }) {
  if (!children) return null
  return (
    <label htmlFor={htmlFor} className="text-[13px] leading-4 font-semibold text-ink">
      {children}
      {mark ? (
        <span className="ml-0.5 text-danger" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  )
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {'input'|'textarea'|'select'} [props.as]  Control type to render.
 * @param {string} [props.hint]   Helper text below the control.
 * @param {string} [props.error]  Error message; also flips aria-invalid.
 * @param {Array<{value:string,label:string}>} [props.options]  Required for `select`.
 * @param {'md'|'lg'|'responsive'} [props.size]  Control height: 44px / 48px / 44 then 48 at lg.
 * @param {boolean} [props.requiredMark]  Show the red asterisk. Off where the
 *   reference omits it (e.g. the login screen) while keeping `required` for a11y.
 */
export default function FormField({
  label,
  as = 'input',
  id,
  hint,
  error,
  required = false,
  requiredMark = true,
  options = [],
  size = 'md',
  className,
  containerClassName,
  ...props
}) {
  const generatedId = useId()
  const fieldId = id || generatedId
  const hintId = hint ? `${fieldId}-hint` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const shared = {
    id: fieldId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    required,
    className: cn(
      CONTROL_BASE,
      as !== 'textarea' && CONTROL_HEIGHT[size],
      error && 'border-danger focus:border-danger',
      className
    ),
    ...props,
  }

  return (
    <div className={cn('flex flex-col gap-2', containerClassName)}>
      <Label htmlFor={fieldId} mark={required && requiredMark}>
        {label}
      </Label>

      {as === 'textarea' ? (
        <textarea rows={4} {...shared} className={cn(shared.className, 'py-3')} />
      ) : as === 'select' ? (
        <select {...shared}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input {...shared} />
      )}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
