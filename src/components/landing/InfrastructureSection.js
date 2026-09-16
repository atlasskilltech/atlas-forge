'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { INFRASTRUCTURE } from './infrastructure-data'

/**
 * "State-of-art / Ready To Build" — the infrastructure block.
 *
 * Reference: /reference/landing-page/Property 1=Default.png (all four closed)
 *            and Variant2–Variant5 (each one open).
 *
 * Four cards, each with a ⊕ that opens a full-width panel beneath the row.
 * One panel at a time: the reference has no frame with two open, and the panel
 * is full-width, so stacking them would break the layout it draws.
 *
 * The card media are the reference's own clips, so the still in each card is
 * that clip's first frame. They do not fetch until the block is near the
 * viewport — this sits roughly a third of the way down a long page, and four
 * autoplaying videos are not worth downloading for a visitor who stops above
 * it.
 */
export default function InfrastructureSection() {
  const [openId, setOpenId] = useState(null)
  const [mediaReady, setMediaReady] = useState(false)
  const sectionRef = useRef(null)

  /* ---- Hold the videos back until the block is close to view ------------ */
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return undefined

    // No IntersectionObserver (or reduced-motion preference) → show the
    // posters and never fetch a clip. The block still reads correctly.
    if (typeof IntersectionObserver === 'undefined') return undefined
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMediaReady(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  /* ---- Escape closes the open panel ------------------------------------- */
  useEffect(() => {
    if (!openId) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [openId])

  const open = INFRASTRUCTURE.find((item) => item.id === openId) ?? null

  function toggle(id) {
    setOpenId((current) => (current === id ? null : id))
  }

  return (
    <section
      ref={sectionRef}
      id="infrastructure"
      className="bg-forge-bg-alt py-20 lg:py-28"
      aria-labelledby="infrastructure-heading"
    >
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        {/* ---- Heading row ------------------------------------------------ */}
        <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)_260px] lg:gap-10">
          <p className="pt-3 text-[11px] leading-[1.7] font-medium tracking-[0.28em] text-forge-purple uppercase">
            The
            <br className="hidden lg:block" /> Infrastructure
          </p>

          <h2
            id="infrastructure-heading"
            className="text-[54px] leading-[0.96] font-bold tracking-[-0.025em] text-forge-ink sm:text-[72px] lg:text-[86px]"
          >
            State-of-art
            <br />
            <span className="text-forge-pink">
              Ready To
              <br />
              Build
            </span>
          </h2>

          <p className="text-[13px] leading-[19px] text-[#55546c] lg:pt-3">
            3D printing, creative production and hands-on making are active today on one Mumbai
            campus.
          </p>
        </div>

        {/* ---- The four cards --------------------------------------------- */}
        <ul className="mt-14 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4 lg:gap-x-10">
          {INFRASTRUCTURE.map((item) => (
            <InfrastructureCard
              key={item.id}
              item={item}
              open={openId === item.id}
              mediaReady={mediaReady}
              onToggle={() => toggle(item.id)}
            />
          ))}
        </ul>
      </div>

      {/* ---- The expanded panel ------------------------------------------- */}
      {open ? (
        // `key` remounts on a different card, which re-runs the panel's own
        // focus effect — otherwise opening a second card silently leaves focus
        // on the first panel's heading.
        <ExpandedPanel key={open.id} item={open} onClose={() => setOpenId(null)} />
      ) : null}
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/* Card                                                                       */
/* -------------------------------------------------------------------------- */

function InfrastructureCard({ item, open, mediaReady, onToggle }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!mediaReady || !video) return
    // `play()` rejects when autoplay is refused; the poster stays, which is
    // exactly the closed-card still the reference draws.
    video.play?.().catch(() => {})
  }, [mediaReady])

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`infrastructure-panel-${item.id}`}
        className="group block w-full cursor-pointer text-left"
      >
        <div
          className={cn(
            'relative aspect-[295/240] w-full overflow-hidden rounded-[14px] bg-[#dcdcdc]',
            'transition-shadow duration-200',
            open
              ? 'ring-2 ring-forge-purple ring-offset-4 ring-offset-forge-bg-alt'
              : 'group-hover:shadow-[0_14px_30px_-14px_rgb(26_20_80/0.35)]'
          )}
        >
          <video
            ref={videoRef}
            // `src` is only attached once the block is near the viewport, so an
            // untouched page never downloads four clips.
            src={mediaReady ? item.video : undefined}
            poster={item.poster}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
            className="size-full object-cover"
          />
        </div>

        <div className="mt-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[17px] leading-[22px] font-bold text-forge-ink">{item.name}</h3>
            <p className="mt-0.5 text-[15px] leading-[21px] text-forge-ink/85">{item.cardNote}</p>
          </div>

          <span
            aria-hidden="true"
            className={cn(
              'mt-1 shrink-0 transition-transform duration-200',
              open ? 'rotate-45 text-forge-purple' : 'text-forge-ink group-hover:text-forge-purple'
            )}
          >
            <PlusIcon />
          </span>
          <span className="sr-only">
            {open ? `Close ${item.name} details` : `Open ${item.name} details`}
          </span>
        </div>
      </button>
    </li>
  )
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor">
      <circle cx="10" cy="10" r="8.4" strokeWidth="1.1" />
      <path d="M10 6.2v7.6M6.2 10h7.6" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" fill="none" stroke="currentColor">
      <circle cx="10" cy="10" r="8.4" strokeWidth="1.1" />
      <path d="M6.2 10h7.6" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/* Expanded panel                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Reference: the lower half of each "Property 1=Variant*.png".
 *
 * Full-bleed white sheet with a violet tab overhanging its left edge, a
 * magenta statistics band that runs to the right edge of the viewport, then
 * the capability list and the pill group.
 */
function ExpandedPanel({ item, onClose }) {
  const headingRef = useRef(null)

  // Move the reader to the panel that just appeared; without this a keyboard
  // or screen-reader user stays on the ⊕ and is told nothing opened.
  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <div
      id={`infrastructure-panel-${item.id}`}
      className="relative mt-14 lg:mt-16"
      role="region"
      aria-label={item.name}
    >
      {/* The violet tab that overhangs the sheet on the left. */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 h-[150px] w-[38px] rounded-r-[6px] bg-forge-purple-soft sm:h-[210px] sm:w-[48px] lg:h-[260px] lg:w-[60px]"
      />

      <div className="bg-white pt-9 pb-12 pl-[38px] sm:pt-12 sm:pl-[48px] lg:pt-14 lg:pb-16 lg:pl-[60px]">
        <div className="pr-6 pl-6 sm:pl-8 lg:pr-10 lg:pl-12">
          <div className="flex items-start justify-between gap-6">
            <h3
              ref={headingRef}
              tabIndex={-1}
              className="max-w-[900px] text-[34px] leading-[1.06] font-bold tracking-[-0.02em] text-forge-ink focus:outline-none sm:text-[44px] lg:text-[54px]"
            >
              {item.title.split('\n').map((part, index) => (
                <span key={part || index}>
                  {part}
                  {index === 0 && item.title.includes('\n') ? <br /> : null}
                </span>
              ))}
              <span className="text-forge-pink">{item.titleAccent}</span>
            </h3>

            <button
              type="button"
              onClick={onClose}
              className="mt-1 inline-flex shrink-0 cursor-pointer items-center gap-2 text-[15px] font-normal text-forge-ink transition-opacity hover:opacity-60"
            >
              Close
              <span aria-hidden="true">
                <MinusIcon />
              </span>
            </button>
          </div>

          <p className="mt-3 text-[17px] leading-[24px] font-normal text-forge-pink lg:text-[19px]">
            {item.subtitle}
          </p>

          <p className="mt-4 max-w-[1000px] text-[14px] leading-[21px] text-[#3f3e52] lg:text-[15px]">
            {item.description}
          </p>
        </div>

        {/* ---- Statistics band ------------------------------------------- */}
        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 bg-forge-pink px-6 py-10 sm:px-8 lg:mt-12 lg:grid-cols-4 lg:px-12 lg:py-11">
          {item.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-[30px] leading-none font-bold tracking-[0.02em] text-white lg:text-[38px]">
                  {stat.value}
                </span>
                <span className="mt-2.5 block text-[13px] leading-[17px] text-white/90 lg:text-[14px]">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        {/* ---- Capability list + pills ------------------------------------ */}
        <div className="grid gap-10 px-6 pt-10 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:pt-12">
          <div>
            <h4 className="text-[11px] leading-none font-medium tracking-[0.28em] text-forge-purple uppercase">
              {item.capabilityLabel}
            </h4>

            <ul className="mt-7 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
              {item.capabilities.flat().map((entry, index) => (
                <li
                  key={`${entry}-${index}`}
                  className={cn(
                    'text-[14px] leading-[20px] text-[#2f2e42]',
                    // 3D Printing Farm underlines its entries; the other three
                    // do not. Reference, not preference.
                    item.underlineCapabilities && 'underline decoration-[#2f2e42]/70 underline-offset-[5px]'
                  )}
                >
                  {entry}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-[11px] leading-none font-medium tracking-[0.28em] text-forge-purple uppercase">
              {item.pillsLabel}
            </h4>

            <ul className="mt-7 flex flex-wrap gap-x-3 gap-y-3.5">
              {item.pills.map((pill) => (
                <li
                  key={pill}
                  className="inline-flex h-[34px] items-center rounded-full border border-forge-purple px-4 text-[12.5px] leading-none text-forge-purple"
                >
                  {pill}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
