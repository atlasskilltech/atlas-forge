'use client'

import { cn } from '@/lib/utils'

/**
 * Availability switch — reference: /reference/mast ui/Student/Concierge.png
 * (violet ring indicator on the Availability Status card).
 *
 * A real switch rather than a decorative ring so the state is operable and
 * announced.
 */
export default function Toggle({
  checked = false,
  onChange,
  label,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange?.(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        checked ? 'bg-primary-500' : 'bg-line',
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          'inline-block size-[18px] rounded-full bg-surface shadow-card transition-transform',
          checked ? 'translate-x-[26px]' : 'translate-x-1'
        )}
      />
    </button>
  )
}
