import { Banner } from '@/components/ui'
import { READ_ONLY_NOTE } from '@/data/admin'

/**
 * Reference: footer strip on /reference/mast ui/SA/All Startups.png.
 * Closes every Super Admin table with the escalation path.
 */
export default function ReadOnlyNote({ className }) {
  return (
    <Banner tone="neutral" className={className}>
      {READ_ONLY_NOTE}
    </Banner>
  )
}
