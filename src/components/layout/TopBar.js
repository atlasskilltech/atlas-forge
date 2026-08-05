'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { brand, siteConfig } from '@/config/site'
import { getRole } from '@/config/roles'
import { cn } from '@/lib/utils'

/**
 * Mobile top bar — 390x56, #1E2235.
 * Reference: /reference/phone components/TopBar/*.png
 *
 * Two shapes:
 *   default  wordmark left · role chip absolutely centred · university logo + log out
 *   back     32px back button + screen title left · log out right (form screens)
 *
 * Role chip is the role accent at 20% over the navy, with the accent as the label.
 */

const CHIP_TONE = {
  primary: 'bg-primary-500/20 text-primary-500',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
  neutral: 'bg-neutral/20 text-neutral',
}

function IconButton({ children, label, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="flex size-8 shrink-0 items-center justify-center rounded-control bg-navy-control text-sm text-white/80 transition-colors hover:text-white"
      {...props}
    >
      {children}
    </button>
  )
}

/**
 * @param {object}  props
 * @param {string}  props.role
 * @param {string}  [props.title]    Screen title; switches the bar to its back-arrow shape.
 * @param {string}  [props.backHref] Explicit back target; defaults to router.back().
 * @param {Function}[props.onLogout]
 */
export default function TopBar({ role, title, backHref, onLogout }) {
  const router = useRouter()
  const roleConfig = getRole(role)
  const showBack = Boolean(title)

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex h-topbar items-center bg-navy-900 pl-4 pr-3 lg:hidden">
      {showBack ? (
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {backHref ? (
            <Link
              href={backHref}
              aria-label="Go back"
              className="flex size-8 shrink-0 items-center justify-center rounded-control bg-navy-control text-sm text-white/80"
            >
              ←
            </Link>
          ) : (
            <IconButton label="Go back" onClick={() => router.back()}>
              ←
            </IconButton>
          )}
          <h1 className="truncate text-sm font-bold text-white">{title}</h1>
        </div>
      ) : (
        <>
          <p className="text-sm font-bold tracking-[0.01em] text-white">
            ATLAS FORGE
          </p>

          {roleConfig ? (
            <span
              className={cn(
                'absolute left-1/2 -translate-x-1/2 rounded-full px-4 text-[11px] font-semibold leading-6',
                CHIP_TONE[roleConfig.chipTone]
              )}
            >
              {roleConfig.shortLabel}
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-2">
            {/* White-alpha variant — the bar sits on #1E2235. */}
            <Image
              src={brand.universityLogoWhite}
              alt={siteConfig.university}
              width={48}
              height={28}
              priority
              className="h-7 w-auto"
            />
          </div>
        </>
      )}

      <div className={cn('flex items-center', showBack ? 'ml-3' : 'ml-2')}>
        <IconButton label="Log out" onClick={onLogout ?? (() => router.push('/login'))}>
          ↩
        </IconButton>
      </div>
    </header>
  )
}
