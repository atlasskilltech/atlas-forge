'use client'

import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Student/{Browse Jobs,Browse Projects}.png
 * Measured: 29px tall pills, 9px apart, active filled #1E2235 with white text.
 *
 * Controlled filter row. Renders as a tablist so arrow-key semantics and the
 * selected state are exposed to assistive tech.
 */
export default function FilterTabs({
  options = [],
  value,
  onChange,
  label = 'Filter',
  className,
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex flex-wrap items-center gap-[9px]', className)}
    >
      {options.map((option) => {
        const optionValue = option.value ?? option
        const optionLabel = option.label ?? option
        const active = optionValue === value

        return (
          <button
            key={optionValue}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(optionValue)}
            className={cn(
              'h-[29px] rounded-control px-3.5 text-[13px] font-medium whitespace-nowrap transition-colors',
              active
                ? 'bg-navy-900 text-white'
                : 'border border-line bg-surface text-muted hover:text-ink'
            )}
          >
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}
