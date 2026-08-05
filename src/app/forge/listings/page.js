import { AppShell } from '@/components/layout'
import { ListingsTable } from '@/components/forge'
import { Chip, PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { listingCounts } from '@/data/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Job Listings',
  description: 'Every job and collab listing across ATLAS Forge.',
  path: '/forge/listings',
  noIndex: true,
})

export default function ForgeListingsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 lg:mb-[22px]">
        <PageTitle>
          <span className="lg:hidden">All Listings</span>
          <span className="hidden lg:inline">All Job Listings</span>
        </PageTitle>
        <div className="hidden shrink-0 gap-2.5 lg:flex">
          {listingCounts.map((count) => (
            <Chip key={count.label} tone={count.tone} size="lg" className="h-[26px]">
              {count.label}
            </Chip>
          ))}
        </div>
      </div>
      <ListingsTable />
    </AppShell>
  )
}
