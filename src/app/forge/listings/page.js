import { AppShell } from '@/components/layout'
import { ListingsTable } from '@/components/forge'
import { Chip, PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Job Listings',
  description: 'Every job and collab listing across ATLAS Forge.',
  path: '/forge/listings',
  noIndex: true,
})

export default async function ForgeListingsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/listings')
  const { rows, filters, counts } = await forge.getListings()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 lg:mb-[22px]">
        <PageTitle>
          <span className="lg:hidden">All Listings</span>
          <span className="hidden lg:inline">All Job Listings</span>
        </PageTitle>
        <div className="hidden shrink-0 gap-2.5 lg:flex">
          {counts.map((count) => (
            <Chip key={count.label} tone={count.tone} size="lg" className="h-[26px]">
              {count.label}
            </Chip>
          ))}
        </div>
      </div>
      <ListingsTable rows={rows} filters={filters} />
    </AppShell>
  )
}
