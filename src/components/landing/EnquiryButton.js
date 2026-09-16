'use client'

import { cn } from '@/lib/utils'
import { useEnquiry } from './EnquiryProvider'

/**
 * A button that opens one of the two enquiry sheets.
 *
 * The only reason the surrounding sections need no `'use client'` of their
 * own: every CTA on the page is one of these, and everything around it stays
 * a server component.
 *
 * @param {'service'|'partner'} props.sheet  Which sheet to open.
 */
export default function EnquiryButton({ sheet, className, children, ...props }) {
  const { openService, openPartner } = useEnquiry()

  return (
    <button
      type="button"
      onClick={sheet === 'partner' ? openPartner : openService}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  )
}
