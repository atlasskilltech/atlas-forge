'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Avatar, BrandLogo } from '@/components/ui'
import { NAVBAR_NAV, ROLE_HOME } from '@/config/navigation'
import { siteConfig } from '@/config/site'
import { cn } from '@/lib/utils'

/**
 * Desktop navbar — 1440x60, white, 1px #ECEDF4 bottom rule.
 * Reference: /reference/components/Navbar*.png and every /reference/mast ui screen.
 *
 * Measured geometry (1440 frame):
 *   28px left gutter · university logo 65x38 · 30px gap · Forge logo 118x34
 *   31px gap · links (34px text-to-text) · 31px gap · search 80x30 · 8px · 34px buttons
 *   Log out pill sits 92px from the right edge — consistent across all five screens.
 */
/**
 * Signed-in identity drawn in each reference frame: student and founder screens
 * show SG, all three manager screens show MP. Overridable via the `user` prop.
 */
const DEFAULT_USER = {
  member: { name: 'Shantanu Ghuriani', initials: 'SG' },
  manager: { name: 'Mihir Pawar', initials: 'MP' },
}

export default function Navbar({ role, user, notificationLabel = 'N', onLogout }) {
  const pathname = usePathname()
  const router = useRouter()
  const links = NAVBAR_NAV[role] || []
  const isManager = links.some((link) => link.key === 'manage')
  const identity = user ?? DEFAULT_USER[isManager ? 'manager' : 'member']

  return (
    <header className="fixed inset-x-0 top-0 z-40 hidden h-navbar border-b border-line bg-surface lg:block">
      <div className="flex h-full items-center pl-7 pr-8 xl:pr-[92px]">
        <Link
          href={ROLE_HOME[role] || '/'}
          className="flex shrink-0 items-center gap-[30px]"
          aria-label={`${siteConfig.name} home`}
        >
          <BrandLogo mark="university" priority className="h-[38px]" />
          <BrandLogo mark="forge" priority className="h-[34px]" />
        </Link>

        {/* Links stay visible from lg; only the search collapses on laptops. */}
        <nav aria-label="Primary" className="ml-4 xl:ml-[31px]">
          <ul className="flex items-center gap-2.5">
            {links.map((link) => {
              const active = (link.match ?? [link.href]).includes(pathname)
              return (
                <li key={link.key}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'rounded-control px-3 py-1.5 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary-100 text-primary-text'
                        : 'text-muted hover:text-ink'
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ml-4 flex items-center gap-2 xl:ml-[31px]">
          {/* Search is presentational until the API section lands. */}
          <label htmlFor="global-search" className="sr-only">
            Search {siteConfig.name}
          </label>
          <input
            id="global-search"
            type="search"
            placeholder="Search..."
            className="hidden h-[30px] w-20 rounded-control bg-canvas px-2.5 text-[13px] text-ink placeholder:text-[#c0c5d9] focus:outline-none xl:block"
          />
          <button
            type="button"
            className="flex size-[34px] items-center justify-center rounded-control bg-canvas text-[13px] font-semibold text-muted transition-colors hover:text-ink"
            aria-label="Notifications"
          >
            {notificationLabel}
          </button>
          <Avatar
            name={identity.name}
            initials={identity.initials}
            tone={isManager ? 'dark' : 'primary'}
            size="lg"
            className="size-[34px] text-[13px]"
          />
        </div>

        <button
          type="button"
          onClick={onLogout ?? (() => router.push('/login'))}
          className="ml-auto inline-flex h-[29px] shrink-0 items-center gap-2 rounded-control border border-line bg-surface px-3.5 text-[13px] font-semibold text-muted transition-colors hover:text-ink"
        >
          <span aria-hidden="true">↩</span>
          Log out
        </button>
      </div>
    </header>
  )
}
