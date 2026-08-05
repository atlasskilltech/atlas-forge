import { cn } from '@/lib/utils'

/**
 * Shared text primitives so heading sizes stay identical across all 40+ screens
 * instead of being re-declared per page.
 */

/** Screen title — "Welcome, Riya", "Platform Dashboard". */
export function PageTitle({ as: Component = 'h1', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'text-[22px] leading-tight font-bold tracking-[-0.01em] text-ink md:text-[26px]',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

/** Sub-heading inside a page — "Quick Actions", "Recent Activity". */
export function SectionTitle({ as: Component = 'h2', className, children, ...props }) {
  return (
    <Component
      className={cn('text-base font-semibold text-ink md:text-[17px]', className)}
      {...props}
    >
      {children}
    </Component>
  )
}

/** Uppercase eyebrow label — "MY ACTIVITY", "QUICK ACTIONS", sidebar groups. */
export function SectionLabel({ as: Component = 'p', className, children, ...props }) {
  return (
    <Component
      className={cn(
        'text-[11px] font-semibold tracking-[0.08em] text-muted uppercase',
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

/** Muted supporting copy under a title. */
export function Subtle({ as: Component = 'p', className, children, ...props }) {
  return (
    <Component className={cn('text-[13px] text-muted', className)} {...props}>
      {children}
    </Component>
  )
}
