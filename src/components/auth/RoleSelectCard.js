import Link from 'next/link'
import { ROLE_HOME } from '@/config/navigation'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Login/Role Select.png       (card 355x110)
 *            /reference/mast phone ui/Login/Role Select.png (row 358x66)
 *
 * Desktop: 40px monogram tile, two-line description, tinted 26px arrow button.
 * Mobile:  38px tile, single short description, bare arrow.
 * Both shapes come from one element so the role list stays a single source.
 */

const TILE = {
  primary: 'bg-primary-100 text-primary-text',
  success: 'bg-success-fill/12 text-success',
  warning: 'bg-warning-fill/12 text-warning',
  danger: 'bg-danger-fill/10 text-danger',
  neutral: 'bg-neutral-fill/10 text-neutral',
}

const ARROW = {
  primary: 'text-primary-text lg:bg-primary-100',
  success: 'text-success lg:bg-success-fill/12',
  warning: 'text-warning lg:bg-warning-fill/12',
  danger: 'text-danger lg:bg-danger-fill/10',
  neutral: 'text-neutral lg:bg-neutral-fill/10',
}

export default function RoleSelectCard({ role }) {
  return (
    <Link
      href={ROLE_HOME[role.id]}
      className={cn(
        'flex h-[66px] items-center rounded-card border border-line bg-surface px-3.5 shadow-card',
        'transition-shadow hover:shadow-raised',
        // 110px — the reference height — at a 900px viewport and taller, easing
        // down on short viewports so the page never needs to scroll.
        'lg:h-[clamp(80px,12.222vh,110px)] lg:overflow-hidden lg:px-[18px]'
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'flex size-[38px] shrink-0 items-center justify-center rounded-tile text-[13px] font-bold',
          'lg:size-10 lg:text-sm',
          TILE[role.tone]
        )}
      >
        {role.initials}
      </span>

      <span className="ml-3 min-w-0 flex-1 lg:ml-[17px]">
        {/* The reference sets every title on one line and every description on
            two. Pinning that here keeps the card content inside its box when a
            short viewport narrows the grid, instead of spilling over the edge. */}
        <span className="block text-[15px] font-bold text-ink lg:truncate">
          <span className="lg:hidden">{role.mobileLabel}</span>
          <span className="hidden lg:inline">{role.label}</span>
        </span>
        <span className="mt-0.5 block text-[13px] leading-[15px] text-muted lg:hidden">
          {role.mobileDescription}
        </span>
        {/* No `lg:block` here — line-clamp needs `display:-webkit-box`, and a
            block display would silently cancel it. `hidden` still keeps this
            copy off the mobile card. */}
        <span className="mt-0.5 hidden text-[13px] leading-[15px] text-muted lg:line-clamp-2">
          {role.description}
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn(
          'ml-3 flex shrink-0 items-center justify-center text-base',
          'lg:size-[26px] lg:rounded-lg lg:text-sm',
          ARROW[role.tone]
        )}
      >
        →
      </span>
    </Link>
  )
}
