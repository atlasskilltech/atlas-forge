'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useEnquiry } from './EnquiryProvider'

/**
 * Reference: the top strip of /reference/landing-page/Forge Landing - 5.png
 *
 * ATLAS FORGE wordmark · rule · ATLAS SkillTech University lockup, then About,
 * Partner With Us, an outlined Login and the solid "Apply For Atlas
 * Incubation".
 *
 * Login points at `/login`, which is unchanged, and so does the incubation
 * call to action — the application form lives behind sign-in, and the
 * reference gives no other destination.
 */
export default function LandingHeader() {
  const { openPartner } = useEnquiry()
  const [menuOpen, setMenuOpen] = useState(false)

  // A navigation drawer that outlives the page behind it is a trap on a phone.
  useEffect(() => {
    if (!menuOpen) return undefined
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => event.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-forge-bg/95 backdrop-blur-sm">
      <div className="mx-auto flex h-[74px] w-full max-w-[1400px] items-center justify-between gap-6 px-6 lg:h-[76px] lg:px-10">
        <Link href="/" className="flex shrink-0 items-center gap-4" aria-label="ATLAS Forge — home">
          <Image
            src="/assets/landing-page/images/atlas-forge-wordmark.png"
            alt="ATLAS Forge"
            width={250}
            height={70}
            priority
            className="h-[38px] w-auto lg:h-[44px]"
          />
          <span aria-hidden="true" className="h-9 w-px bg-forge-ink/25 lg:h-11" />
          <Image
            src="/assets/landing-page/images/atlas-skilltech-lockup.png"
            alt="ATLAS SkillTech University"
            width={111}
            height={64}
            priority
            className="h-[34px] w-auto lg:h-[40px]"
          />
        </Link>

        {/* ---- Desktop navigation ---------------------------------------- */}
        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          <a
            href="#about"
            className="text-[14px] text-forge-ink transition-opacity hover:opacity-65"
          >
            About
          </a>
          <button
            type="button"
            onClick={openPartner}
            className="cursor-pointer text-[14px] text-forge-ink transition-opacity hover:opacity-65"
          >
            Partner With Us
          </button>
          <Link
            href="/login"
            className="inline-flex h-[38px] items-center rounded-[7px] border border-forge-ink/35 px-6 text-[14px] text-forge-ink transition-colors hover:border-forge-ink hover:bg-forge-ink/5"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="inline-flex h-[38px] items-center rounded-[7px] bg-forge-ink px-6 text-[14px] font-semibold text-white transition-colors hover:bg-forge-purple"
          >
            Apply For Atlas Incubation
          </Link>
        </nav>

        {/* ---- Mobile trigger -------------------------------------------- */}
        <button
          type="button"
          onClick={() => setMenuOpen((value) => !value)}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-nav"
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-[8px] text-forge-ink lg:hidden"
        >
          <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor">
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" strokeWidth="1.6" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {/* ---- Mobile drawer ----------------------------------------------- */}
      <div
        id="landing-mobile-nav"
        hidden={!menuOpen}
        className={cn('border-t border-black/5 bg-forge-bg px-6 pt-4 pb-7 lg:hidden')}
      >
        <nav className="flex flex-col gap-1" aria-label="Primary">
          <a
            href="#about"
            onClick={() => setMenuOpen(false)}
            className="py-3 text-[15px] text-forge-ink"
          >
            About
          </a>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false)
              openPartner()
            }}
            className="cursor-pointer py-3 text-left text-[15px] text-forge-ink"
          >
            Partner With Us
          </button>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-3 inline-flex h-[46px] items-center justify-center rounded-[8px] border border-forge-ink/35 text-[15px] text-forge-ink"
          >
            Login
          </Link>
          <Link
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="mt-2.5 inline-flex h-[46px] items-center justify-center rounded-[8px] bg-forge-ink text-[15px] font-semibold text-white"
          >
            Apply For Atlas Incubation
          </Link>
        </nav>
      </div>
    </header>
  )
}
