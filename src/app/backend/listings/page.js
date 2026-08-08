import { AppShell } from '@/components/layout'
import { ListingsTable } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Listings',
  description: 'Every job and collab listing across ATLAS Forge.',
  path: '/backend/listings',
  noIndex: true,
})

/**
 * NOTE: No BM frame exists. Reuses the Forge Manager All Listings table.
 */
export default async function BackendListingsPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/listings')
  const { rows, filters } = await backend.getListings()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>All Listings</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Every job and collab listing across ATLAS Forge.</Subtle>
      <ListingsTable rows={rows} filters={filters} />
    </AppShell>
  )
}
