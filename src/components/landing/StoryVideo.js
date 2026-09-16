'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

/**
 * A founder story clip in "The Forge Success Story".
 *
 * Reference: /reference/landing-page/Forge Landing - 5.png — two portrait
 * cards showing the dark ATLAS FORGE title frame, which is literally the first
 * frame of each supplied clip.
 *
 * Click to play, and nothing is fetched before that: these are the two longest
 * files on the page, they sit far below the fold, and they have speech, so
 * autoplaying them would be wrong on every count. `preload="none"` plus a
 * withheld `src` means a visitor who never clicks never pays for them.
 */
export default function StoryVideo({ src, poster, label }) {
  const videoRef = useRef(null)
  const [started, setStarted] = useState(false)

  function play() {
    setStarted(true)
    // The element already exists; it gains a `src` on this render, so play on
    // the next tick once the browser has the source attached.
    requestAnimationFrame(() => videoRef.current?.play?.().catch(() => {}))
  }

  return (
    <div className="relative aspect-[9/16] w-full overflow-hidden rounded-[10px] bg-[#1b1240]">
      <video
        ref={videoRef}
        src={started ? src : undefined}
        poster={poster}
        controls={started}
        playsInline
        preload="none"
        className="size-full object-cover"
      />

      {!started ? (
        <button
          type="button"
          onClick={play}
          className="group absolute inset-0 grid cursor-pointer place-items-center focus:outline-none"
        >
          {/* The poster is drawn by next/image rather than the video's own
              `poster`, so it is lazily loaded and correctly sized. */}
          <Image
            src={poster}
            alt=""
            fill
            sizes="(min-width: 1024px) 300px, 45vw"
            className="object-cover"
          />
          <span className="relative grid size-[62px] place-items-center rounded-full bg-white/92 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.5)] transition-transform duration-200 group-hover:scale-105">
            <svg viewBox="0 0 24 24" className="ml-[3px] size-6 fill-forge-ink">
              <path d="M8 5.5v13l11-6.5z" />
            </svg>
          </span>
          <span className="sr-only">{label}</span>
        </button>
      ) : null}
    </div>
  )
}
