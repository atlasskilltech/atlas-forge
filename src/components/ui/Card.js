import { cn } from '@/lib/utils'

/**
 * Reference: /reference/components/Card/*  — white surface, 1px #ECEDF4 border,
 * 14px radius, near-flat elevation.
 *
 * The base container every panel, list row and content card is built from.
 */

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
  xl: 'p-6',
}

export default function Card({
  as: Component = 'div',
  padding = 'md',
  interactive = false,
  className,
  children,
  ...props
}) {
  return (
    <Component
      className={cn(
        'rounded-card border border-line bg-surface shadow-card',
        PADDING[padding],
        interactive &&
          'cursor-pointer transition-shadow duration-150 hover:shadow-raised',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

/** Small uppercase caption that heads most panels (e.g. "RECENT ACTIVITY"). */
export function CardHeader({ title, action, className, ...props }) {
  return (
    <div
      className={cn('flex items-center justify-between gap-3', className)}
      {...props}
    >
      <h2 className="text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
        {title}
      </h2>
      {action}
    </div>
  )
}
