import { cn } from '@/lib/utils'

/**
 * Neutral loading placeholder. Uses the canvas tone rather than a shimmer so it
 * reads as "not yet here" instead of as content.
 */
export default function Skeleton({ className, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-tile bg-line', className)}
      {...props}
    />
  )
}

/**
 * The shape shared by nearly every screen: title, a row of stat tiles, and a
 * stack of cards. Used by the route-level loading boundaries.
 */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-5">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-7 w-56" />
      <div className="flex flex-wrap gap-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[68px] w-[142px] rounded-card" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-[72px] w-full rounded-card" />
        ))}
      </div>
    </div>
  )
}
