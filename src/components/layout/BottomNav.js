'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BOTTOM_NAV } from '@/config/navigation'
import { getRole } from '@/config/roles'
import { cn } from '@/lib/utils'

/**
 * Mobile bottom navigation — 390x83, white, 1px #ECEDF4 top rule.
 * Reference: /reference/phone components/BottomNav/<Role>/*.png
 *
 * Measured: 12px top padding · 32x32 icon tile · 5px gap · 10px label.
 * The active tile is the role accent at 12%; the label takes the accent solid.
 */

const ACTIVE_TILE = {
  primary: 'bg-primary-500/12',
  success: 'bg-success/12',
  warning: 'bg-warning/12',
  danger: 'bg-danger/12',
  neutral: 'bg-neutral/12',
}

const ACTIVE_LABEL = {
  primary: 'text-primary-500',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-neutral',
}

/** The "More" glyph is drawn rather than an emoji so it stays crisp. */
function MoreIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="text-ink"
    >
      <path
        d="M3 5.5h14M3 10h14M3 14.5h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function BottomNav({ role }) {
  const pathname = usePathname()
  const items = BOTTOM_NAV[role] || []
  const tone = getRole(role)?.chipTone || 'primary'

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-safe lg:hidden"
    >
      {/* 82px + the 1px top rule = the reference's 83px total. */}
      <ul className="flex h-[82px] items-start pt-3">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className="flex flex-col items-center gap-[5px]"
              >
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-tile text-[20px] leading-none transition-colors',
                    active ? ACTIVE_TILE[tone] : 'bg-transparent'
                  )}
                >
                  {item.icon === 'more' ? (
                    <MoreIcon />
                  ) : (
                    <span aria-hidden="true">{item.icon}</span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[10px] leading-none',
                    active ? cn('font-semibold', ACTIVE_LABEL[tone]) : 'text-muted'
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
