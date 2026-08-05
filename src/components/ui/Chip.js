import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Chip/*  (21px tall)
 *            /reference/phone components/Chip/*  (20px tall)
 *
 * Status chips are the accent colour at 10–12% alpha with the solid accent as
 * the label colour. The `skill` tone is the one solid-fill exception.
 */

const TONES = {
  success: 'bg-success/12 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-primary-500/12 text-primary-500',
  neutral: 'bg-neutral/10 text-neutral',
  /** Solid lavender fill — skill tags on student cards. */
  skill: 'bg-primary-100 text-primary-500',
}

// Padding/gap are tuned so a skill tag ("UI/UX") renders at the reference 47x21
// and a dotted status chip ("Available") at the reference 80x21.
const SIZES = {
  sm: 'h-5 px-1.5 text-[11px] gap-2',
  md: 'h-[21px] px-2 text-[11px] gap-2.5',
  lg: 'h-6 px-2.5 text-xs gap-2.5',
}

/**
 * Maps the platform's status vocabulary to a tone so callers can pass a raw
 * status string. An explicit `tone` prop always wins.
 */
export const STATUS_TONE = {
  active: 'success',
  available: 'success',
  live: 'success',
  approved: 'success',
  granted: 'success',
  ongoing: 'success',
  open: 'success',
  pending: 'warning',
  requested: 'warning',
  'in review': 'warning',
  awaiting: 'warning',
  rejected: 'danger',
  revoked: 'danger',
  closed: 'danger',
  applied: 'info',
  interview: 'info',
  shortlisted: 'info',
  done: 'neutral',
  'view-only': 'neutral',
  unassigned: 'neutral',
}

/**
 * @param {object}  props
 * @param {'success'|'warning'|'danger'|'info'|'neutral'|'skill'} [props.tone]
 * @param {string}  [props.status]  Status string resolved through STATUS_TONE.
 * @param {boolean} [props.dot]     Show the leading status dot.
 * @param {'sm'|'md'|'lg'} [props.size]
 */
export default function Chip({
  tone,
  status,
  dot = false,
  size = 'md',
  className,
  children,
  ...props
}) {
  const resolved =
    tone || STATUS_TONE[String(status ?? children ?? '').toLowerCase()] || 'info'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-semibold whitespace-nowrap',
        TONES[resolved],
        SIZES[size],
        className
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden="true"
          className="size-1.5 shrink-0 rounded-full bg-current"
        />
      ) : null}
      {children ?? status}
    </span>
  )
}
