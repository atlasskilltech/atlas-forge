'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import IncubationApplyModal from './IncubationApplyModal'

/**
 * Owns whether the public incubation application is open.
 *
 * Its own provider rather than a third slot in `EnquiryProvider`, so the
 * Service and Partner sheets — their state, their provider, their shell — are
 * untouched by this feature. Opened from the header's "Apply For Atlas
 * Incubation", "Join Us" in How to Join Forge, and the footer's "Apply for
 * incubation".
 *
 * Scoped to the landing page, like `EnquiryProvider`: no signed-in screen
 * mounts it.
 */
const IncubationApplyContext = createContext(null)

export function useIncubationApply() {
  const context = useContext(IncubationApplyContext)
  if (!context) {
    throw new Error('useIncubationApply must be used inside <IncubationApplyProvider>')
  }
  return context
}

export default function IncubationApplyProvider({ children }) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])
  const value = useMemo(() => ({ openIncubation: () => setOpen(true), close }), [close])

  return (
    <IncubationApplyContext.Provider value={value}>
      {children}
      <IncubationApplyModal open={open} onClose={close} />
    </IncubationApplyContext.Provider>
  )
}
