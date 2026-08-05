import Link from 'next/link'
import { MORE_TRAY } from '@/config/navigation'
import { PageTitle } from '@/components/ui'

/**
 * Mobile "More" screen — the overflow destination for the fifth bottom-nav slot.
 * Reference: /reference/mast phone ui/<Role>/More Tray.png
 *
 * Measured: 4px drag handle 28px below the top bar · 21px · "More" title
 * · 12px · 64px rows, 12px apart, 358px wide.
 *
 * Rendered as a page (not an overlay) because that is how every reference
 * screen composes it — it keeps the bottom nav visible with "More" active.
 */
export default function MoreTray({ role }) {
  const items = MORE_TRAY[role] || []

  return (
    <div className="space-y-3">
      <div
        aria-hidden="true"
        className="mx-auto h-1 w-9 rounded-full bg-handle"
      />

      <PageTitle className="pt-[17px]">More</PageTitle>

      <ul className="space-y-3 pt-[1px]">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="flex h-16 items-center gap-[15px] rounded-card border border-line bg-surface px-3.5 shadow-card transition-shadow hover:shadow-raised"
            >
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-tile bg-primary-500/8 text-lg"
              >
                {item.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold text-ink">
                  {item.label}
                </span>
                <span className="block truncate text-[13px] text-muted">
                  {item.description}
                </span>
              </span>
              <span aria-hidden="true" className="shrink-0 text-muted">
                ›
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
