'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import PartnerRequestModal from './PartnerRequestModal'
import ServiceRequestModal from './ServiceRequestModal'

/**
 * Owns which enquiry sheet is open.
 *
 * Both sheets are opened from several places — the header, the pink strip, the
 * Concierge block, the footer — so the state lives once, here, rather than
 * being duplicated into each of those. Everything below stays a server
 * component except the buttons themselves (`EnquiryButton`).
 *
 * Scoped to the landing page: nothing in `src/app/(signed-in screens)` mounts
 * this, so no other page gains a listener, a portal or a context.
 */
const EnquiryContext = createContext(null)

export function useEnquiry() {
  const context = useContext(EnquiryContext)
  if (!context) {
    throw new Error('useEnquiry must be used inside <EnquiryProvider>')
  }
  return context
}

export default function EnquiryProvider({ children }) {
  // One slot, not two booleans: the sheets are full-screen, so "both open" is
  // not a state that can look right.
  const [active, setActive] = useState(null)

  const close = useCallback(() => setActive(null), [])

  const value = useMemo(
    () => ({
      openService: () => setActive('service'),
      openPartner: () => setActive('partner'),
      close,
    }),
    [close]
  )

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <ServiceRequestModal open={active === 'service'} onClose={close} />
      <PartnerRequestModal open={active === 'partner'} onClose={close} />
    </EnquiryContext.Provider>
  )
}
