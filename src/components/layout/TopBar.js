'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BrandLogo } from '@/components/ui'
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

/**
 * This bar sits on the dark navy, where the bright Figma tones already clear
 * WCAG AA comfortably (5.5–9.5:1) — the darkened text tokens are for light
 * surfaces and would *fail* here (~3.4:1). So the `-fill` values are used for
 * the label as well as the tint.
 */
const CHIP_TONE = {
  // primary-400 rather than -500: the Figma violet is only 4.10:1 on this navy,
  // and the darkened text token would be 2.88:1. primary-400 reaches 6.54:1.
  primary: 'bg-primary-500/20 text-primary-400',
  success: 'bg-success-fill/20 text-success-fill',
  warning: 'bg-warning-fill/20 text-warning-fill',
  danger: 'bg-danger-fill/20 text-danger-fill',
  neutral: 'bg-neutral-fill/20 text-neutral-fill',
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
            <BrandLogo mark="universityWhite" priority className="h-7" />
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
