import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Banner/ViewOnly-1.png (900x40)
 *            /reference/phone components/Banner/ViewOnly/Mobile.png (358x40)
 *
 * Full-width inline notice. The Super Admin view-only notice is the primary
 * use, but the tones cover every advisory state on the platform.
 */

const TONES = {
  neutral: 'border-line bg-canvas text-muted',
  info: 'border-primary-200 bg-primary-50 text-primary-600',
  success: 'border-success/20 bg-success/8 text-success',
  warning: 'border-warning/25 bg-warning/8 text-warning',
  danger: 'border-danger/20 bg-danger/8 text-danger',
}

/**
 * @param {object} props
 * @param {'neutral'|'info'|'success'|'warning'|'danger'} [props.tone]
 * @param {React.ReactNode} [props.icon]  Leading glyph or emoji.
 */
export default function Banner({
  tone = 'neutral',
  icon,
  className,
  children,
  ...props
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex min-h-10 w-full items-center gap-2.5 rounded-tile border px-3.5 py-2.5 text-[13px]',
        TONES[tone],
        className
      )}
      {...props}
    >
      {icon ? (
        <span aria-hidden="true" className="flex shrink-0 items-center text-sm">
          {icon}
        </span>
      ) : null}
      <span>{children}</span>
    </div>
  )
}
