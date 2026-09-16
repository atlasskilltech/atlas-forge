'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * The shell both landing-page forms are drawn in.
 *
 * Reference: /reference/landing-page/services.png
 *            /reference/landing-page/Partner with us.png
 *
 * A white header strip (eyebrow left, text "Close" right) above an #F5F5F7
 * body — a sheet, not the centred confirmation card that `@/components/ui`
 * Modal draws. That component is unchanged and still serves every signed-in
 * screen; this one exists because the reference is a different object, not
 * because the platform's dialog needed changing.
 *
 * The behaviour, though, is the same contract as the platform dialog: Escape
 * closes, the backdrop closes, Tab cycles inside, the page behind does not
 * scroll, and focus returns to whatever opened it.
 */
export default function EnquirySheet({ open, onClose, eyebrow, labelledBy, children }) {
  const panelRef = useRef(null)
  const fallbackId = useId()
  const titleId = labelledBy ?? fallbackId

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = panel.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    // The first field, not the Close button — the point of opening this is to
    // start typing. Falls back to the panel when a sheet has no controls yet.
    const panel = panelRef.current
    const firstField = panel?.querySelector('input, select, textarea')
    ;(firstField ?? panel)?.focus()

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-100 flex justify-center overflow-y-auto bg-forge-ink/45 p-0 backdrop-blur-[2px] sm:p-6 lg:p-10"
      onMouseDown={(event) => {
        // mousedown, not click: a click that STARTS inside the panel and ends
        // on the backdrop (selecting text, then releasing) would otherwise
        // close the sheet and lose what the visitor had typed.
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'relative my-0 h-fit w-full max-w-[1048px] overflow-hidden bg-[#f5f5f7]',
          'font-forge shadow-[0_32px_80px_-24px_rgb(26_20_80/0.45)] focus:outline-none',
          'sm:my-auto sm:rounded-[18px]'
        )}
      >
        {/* ---- Header strip -------------------------------------------- */}
        <div className="flex items-center justify-between gap-4 bg-white px-6 py-5 sm:px-10 sm:py-6">
          <p className="text-base font-bold text-forge-ink sm:text-lg">{eyebrow}</p>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 shrink-0 rounded-md px-1 text-lg font-normal text-forge-ink transition-opacity hover:opacity-60 sm:text-xl"
          >
            Close
          </button>
        </div>

        <div className="px-6 pt-6 pb-10 sm:px-10 sm:pt-8 sm:pb-12">{children}</div>
      </div>
    </div>
  )
}
