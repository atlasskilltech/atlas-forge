import { AppShell } from '@/components/layout'
import { ListingsTable } from '@/components/forge'
import { ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Job Listings',
  description: 'Every job and collab listing across ATLAS Forge.',
  path: '/admin/job-listings',
  noIndex: true,
})

/**
 * NOTE: No SA frame exists. Reuses the All Listings table, closed with the read-only note.
 */
export default function AdminJobListingsPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle>Job Listings</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Every job and collab listing across ATLAS Forge.</Subtle>
      <ListingsTable />
      <ReadOnlyNote className="mt-5" />
    </AppShell>
  )
}
