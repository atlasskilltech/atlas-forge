'use client'

import { cn } from '@/lib/utils'
import { useIncubationApply } from './IncubationApplyProvider'

/**
 * A button that opens the public incubation application.
 *
 * The counterpart of `EnquiryButton`: it lets the server-rendered sections of
 * the landing page open the modal without becoming client components.
 */
export default function IncubationApplyButton({ className, children, onClick, ...props }) {
  const { openIncubation } = useIncubationApply()

  return (
    <button
      type="button"
      onClick={(event) => {
        onClick?.(event)
        openIncubation()
      }}
      className={cn('cursor-pointer', className)}
      {...props}
    >
      {children}
    </button>
  )
}
