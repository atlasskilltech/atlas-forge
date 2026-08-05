import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Button/{Primary,Secondary}.png (144x38, 141x36)
 *            /reference/phone components/Button/*  (all 36px tall, full-width 358px)
 */

const VARIANTS = {
  /** Solid violet — the single primary action on a screen. */
  primary:
    'bg-primary-500 text-white shadow-card hover:bg-primary-600 active:bg-primary-700',
  /** White pill with a hairline border — the default action. */
  secondary:
    'bg-surface text-ink border border-line hover:bg-line-soft active:bg-line',
  /** Same shell as `secondary` but muted label, used beside dense content. */
  subtle:
    'bg-surface text-muted border border-line hover:bg-line-soft active:bg-line',
  /** Tinted green — approval actions on mobile queues. */
  approve: 'bg-success-fill/12 text-success hover:bg-success-fill/20 active:bg-success-fill/25',
  /** Tinted coral — rejection actions on mobile queues. */
  reject: 'bg-danger-fill/10 text-danger hover:bg-danger-fill/18 active:bg-danger-fill/25',
  /** Solid green — desktop approval queues and "Yes, Approve" confirmations. */
  success: 'bg-success-fill text-white shadow-card hover:brightness-95 active:brightness-90',
  /** Solid coral — "Yes, Reject" confirmations. */
  dangerSolid: 'bg-danger-fill text-white shadow-card hover:brightness-95 active:brightness-90',
  /** White with a coral outline — destructive but not tinted (e.g. Revoke Access). */
  danger:
    'bg-surface text-danger border border-danger-fill hover:bg-danger-fill/8 active:bg-danger-fill/12',
  /** Chrome-free text button. */
  ghost: 'bg-transparent text-muted hover:bg-line-soft hover:text-ink',
  /** Inline text link styled as a button for keyboard/tap targets. */
  link: 'bg-transparent text-primary-text hover:text-primary-700 hover:underline underline-offset-4 px-0',
}

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-[38px] px-[18px] text-sm gap-2',
  xl: 'h-11 px-5 text-[15px] gap-2',
}

/**
 * The single button primitive for the whole platform.
 *
 * @param {object}   props
 * @param {'primary'|'secondary'|'subtle'|'approve'|'reject'|'success'|'dangerSolid'|'danger'|'ghost'|'link'} [props.variant]
 * @param {'sm'|'md'|'lg'|'xl'} [props.size]
 * @param {boolean}  [props.fullWidth]  Stretch to the container (mobile CTAs).
 * @param {React.ReactNode} [props.leadingIcon]   Rendered before the label.
 * @param {React.ReactNode} [props.trailingIcon]  Rendered after the label.
 * @param {React.ElementType} [props.as]  Render as another element, e.g. `Link`.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  as: Component = 'button',
  type,
  disabled = false,
  ...props
}) {
  return (
    <Component
      // Only set `type` for real buttons — passing it to an anchor is invalid HTML.
      type={Component === 'button' ? type || 'button' : type}
      disabled={Component === 'button' ? disabled : undefined}
      aria-disabled={disabled || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-control font-semibold whitespace-nowrap',
        'transition-colors duration-150 select-none',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leadingIcon ? (
        <span aria-hidden="true" className="flex items-center">
          {leadingIcon}
        </span>
      ) : null}
      {children}
      {trailingIcon ? (
        <span aria-hidden="true" className="flex items-center">
          {trailingIcon}
        </span>
      ) : null}
    </Component>
  )
}
