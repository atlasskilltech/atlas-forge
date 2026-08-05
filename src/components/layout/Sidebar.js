'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Badge } from '@/components/ui'
import { SIDEBAR_NAV } from '@/config/navigation'
import { cn } from '@/lib/utils'

/**
 * Desktop sidebar — 220px, #1E2235, fixed under the 60px navbar.
 * Reference: /reference/components/Sidebar/*.png
 *
 * Measured vertical rhythm (verified against the exports to the pixel):
 *   34px top padding · group label 11px/16px line box · 6px · items
 *   item 36px tall, 2px apart (38px pitch) · 12px between groups
 *   16px side padding, items inset a further 12px (bullet lands at x=28)
 */
export default function Sidebar({ role, className }) {
  const pathname = usePathname()
  const groups = SIDEBAR_NAV[role] || []

  return (
    <aside
      className={cn(
        'fixed left-0 top-navbar z-30 hidden h-[calc(100dvh-var(--spacing-navbar))] w-sidebar',
        'overflow-y-auto scrollbar-none bg-navy-900 px-4 pb-8 pt-[34px] lg:block',
        className
      )}
    >
      <nav aria-label="Sidebar">
        {groups.map((group, groupIndex) => (
          <div key={group.label} className={cn(groupIndex > 0 && 'mt-3')}>
            {group.divider ? (
              <hr className="mb-3 mt-0.5 border-0 border-t border-white/8" />
            ) : null}

            <h2 className="px-3 text-[11px] font-semibold uppercase tracking-[0.08em] leading-4 text-navy-label">
              {group.label}
            </h2>

            <ul className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        // min-h rather than a fixed height so long labels wrap to
                        // two lines exactly as they do in the Founder reference.
                        'flex min-h-9 items-center gap-2.5 rounded-control px-3 py-1.5 text-[13px] leading-tight transition-colors',
                        active
                          ? 'bg-navy-active font-semibold text-navy-item-active'
                          : 'text-navy-item hover:bg-navy-active/50 hover:text-navy-item-active'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'size-1.5 shrink-0 rounded-full',
                          active ? 'bg-primary-500' : 'bg-navy-dot'
                        )}
                      />
                      <span className="min-w-0 flex-1">{item.label}</span>
                      {item.badge ? <Badge count={item.badge} /> : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
