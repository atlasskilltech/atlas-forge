import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Card/Stat.png (desktop)
 *            /reference/phone components/Card/StatTile/Mobile.png (64x65)
 *
 * A large tinted value above a muted caption. Used across every role dashboard.
 */

const TONES = {
  primary: 'text-primary-text',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-muted',
  ink: 'text-ink',
}

/**
 * @param {object} props
 * @param {string|number} props.value  Headline figure or short word ("Active").
 * @param {string} props.label         Caption beneath the value.
 * @param {'primary'|'success'|'warning'|'danger'|'neutral'|'ink'} [props.tone]
 * @param {boolean} [props.compact]    Mobile tile proportions.
 * @param {string} [props.caption]     Optional third line, e.g. "+2 this week"
 *   on the Super Admin Activity Report tiles.
 */
export default function StatCard({
  value,
  label,
  caption,
  tone = 'primary',
  compact = false,
  className,
  ...props
}) {
  return (
    <div
      className={cn(
        'rounded-tile border border-line bg-surface shadow-card',
        compact ? 'px-3 py-2.5' : 'px-4 py-3.5',
        className
      )}
      {...props}
    >
      <p
        className={cn(
          'font-bold leading-tight',
          compact ? 'text-[20px]' : 'text-[28px]',
          TONES[tone]
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          'mt-0.5 font-medium text-muted',
          compact ? 'text-[10px]' : 'text-[13px]'
        )}
      >
        {label}
      </p>
      {caption ? (
        <p className="mt-1 text-[11px] text-muted/70">{caption}</p>
      ) : null}
    </div>
  )
}
