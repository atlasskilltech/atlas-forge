'use client'

import { useCallback, useEffect, useId, useRef } from 'react'
import { cn } from '@/lib/utils'
import Button from './Button'

/**
 * Reference: /reference/mast ui/Overlay/*.png
 *   confirmation card ~440px wide · form card ~730px wide, both 16px radius
 *   over a dimmed backdrop.
 *
 * Handles Escape, backdrop click, initial focus and background scroll locking.
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  showClose = false,
  size = 'sm',
  className,
  children,
}) {
  const panelRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') onClose?.()
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return undefined

    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    panelRef.current?.focus()

    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', handleKeyDown)
      previouslyFocused?.focus?.()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-navy-950/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative w-full rounded-card bg-surface shadow-modal focus:outline-none',
          size === 'sm' ? 'max-w-[440px] p-8' : 'max-w-[730px] p-8',
          className
        )}
      >
        {showClose ? (
          <Button
            variant="ghost"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-6 top-6 size-8 rounded-control bg-canvas p-0 text-muted"
          >
            ✕
          </Button>
        ) : null}

        {title ? (
          <h2
            id={titleId}
            className={cn(
              'font-bold text-ink',
              size === 'sm' ? 'text-center text-xl' : 'text-xl'
            )}
          >
            {title}
          </h2>
        ) : null}

        {description ? (
          <p
            id={descriptionId}
            className={cn(
              'text-[13px] leading-[18px] text-muted',
              size === 'sm' ? 'mt-2 text-center' : 'mt-1'
            )}
          >
            {description}
          </p>
        ) : null}

        {children}
      </div>
    </div>
  )
}

/** The green success mark used by every "submitted" confirmation. */
export function SuccessMark() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto flex size-[60px] items-center justify-center rounded-full bg-success/12 text-2xl text-success"
    >
      ✓
    </div>
  )
}

/**
 * Confirmation overlay: success mark, message, and one or two actions.
 * Reference: Application Sent! / Collab Post Submitted! / Request Sent! etc.
 */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  primaryLabel = 'Done',
  onPrimary,
  secondaryLabel,
  onSecondary,
}) {
  return (
    <Modal open={open} onClose={onClose} className="pt-8">
      <SuccessMark />
      <h2 className="mt-5 text-center text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 text-center text-[13px] leading-[18px] text-muted">
        {description}
      </p>
      <div className="mt-6 flex gap-3">
        {secondaryLabel ? (
          <Button
            variant="secondary"
            fullWidth
            className="h-11"
            onClick={onSecondary ?? onClose}
          >
            {secondaryLabel}
          </Button>
        ) : null}
        <Button fullWidth className="h-11" onClick={onPrimary ?? onClose}>
          {primaryLabel}
        </Button>
      </div>
    </Modal>
  )
}
