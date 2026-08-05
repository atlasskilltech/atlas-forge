'use client'

import { cn } from '@/lib/utils'

/**
 * Reference: "Engagement Type" on Post a Collab (ink-filled active state) and
 * "Current Stage" / "Preferred mentor type" (violet-filled active state).
 *
 * Same control, two tones — the Figma uses both, so `tone` selects between them.
 */

const ACTIVE = {
  ink: 'bg-navy-900 text-white',
  primary: 'bg-primary-500 text-white',
}

const INACTIVE = {
  ink: 'border border-line bg-surface text-muted hover:text-ink',
  primary: 'bg-primary-100/60 text-muted hover:text-primary-500',
}

export default function SegmentedControl({
  options = [],
  value,
  onChange,
  tone = 'ink',
  label,
  name,
  className,
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-2', className)}
    >
      {options.map((option) => {
        const optionValue = option.value ?? option
        const optionLabel = option.label ?? option
        const active = optionValue === value

        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            name={name}
            aria-checked={active}
            onClick={() => onChange?.(optionValue)}
            className={cn(
              'h-9 rounded-control px-4 text-[13px] font-semibold whitespace-nowrap transition-colors',
              active ? ACTIVE[tone] : INACTIVE[tone]
            )}
          >
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}
