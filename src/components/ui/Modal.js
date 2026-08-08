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
      if (event.key === 'Escape') {
        onClose?.()
        return
      }
      if (event.key !== 'Tab') return

      // Focus trap: keep Tab / Shift+Tab cycling inside the dialog so the
      // page behind it can never be reached while it is open.
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

    // Focus the first control if there is one, otherwise the panel itself.
    const panel = panelRef.current
    const firstFocusable = panel?.querySelector(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    )
    ;(firstFocusable ?? panel)?.focus()

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

const MARK_TONE = {
  success: 'bg-success-fill/12 text-success',
  danger: 'bg-danger-fill/10 text-danger',
  primary: 'bg-primary-500/12 text-primary-text',
  warning: 'bg-warning-fill/12 text-warning',
}

/**
 * The tinted icon circle used by confirmations.
 * Reference: /reference/mast ui/Overlay/*.png — green ✓, coral !, violet ✓.
 */
export function SuccessMark({ tone = 'success', glyph = '✓' }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'mx-auto flex size-[60px] items-center justify-center rounded-full text-2xl',
        MARK_TONE[tone]
      )}
    >
      {glyph}
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

const ACTION_BUTTON = {
  success: 'success',
  danger: 'dangerSolid',
  primary: 'primary',
  warning: 'primary',
}

/**
 * Destructive/irreversible confirmation: tinted mark, Cancel + a solid
 * tone-coloured confirm.
 *
 * Reference: /reference/mast ui/Overlay/FM Approval Queue {Approve,Reject} Confirm.png
 *            /reference/mast ui/Overlay/FM Incubation Applications Grant Confirm.png
 */
export function ActionDialog({
  open,
  onClose,
  tone = 'success',
  glyph,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmDisabled = false,
  onConfirm,
}) {
  return (
    <Modal open={open} onClose={onClose} className="pt-8">
      <SuccessMark tone={tone} glyph={glyph ?? (tone === 'danger' ? '!' : '✓')} />
      <h2 className="mt-5 text-center text-xl font-bold text-ink">{title}</h2>
      <p className="mt-2 text-center text-[13px] leading-[18px] text-muted">
        {description}
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" className="h-11 flex-[2]" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          variant={ACTION_BUTTON[tone]}
          className="h-11 flex-[3]"
          disabled={confirmDisabled}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
