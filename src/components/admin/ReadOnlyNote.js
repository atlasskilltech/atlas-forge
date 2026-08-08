import { Banner } from '@/components/ui'

/**
 * Reference: footer strip on /reference/mast ui/SA/All Startups.png.
 * Closes every Super Admin table with the escalation path.
 *
 * The copy is a constant rather than a database row: it describes how the
 * platform is governed, not its state, and it must still read correctly on a
 * screen where nothing has loaded.
 */
const READ_ONLY_NOTE =
  'This is a read-only view. To make changes, contact the Backend Manager or Forge Manager.'

export default function ReadOnlyNote({ className }) {
  return (
    <Banner tone="neutral" className={className}>
      {READ_ONLY_NOTE}
    </Banner>
  )
}
