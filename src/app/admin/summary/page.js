import { AppShell } from '@/components/layout'
import { OverviewView, ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Summary',
  description: 'Headline platform figures at a glance.',
  path: '/admin/summary',
  noIndex: true,
})

/**
 * NOTE: No SA frame exists. Reuses the Platform Overview stats and startup table.
 */
export default function AdminSummaryPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle>Platform Summary</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Headline platform figures at a glance.</Subtle>
      <OverviewView />
      <ReadOnlyNote className="mt-5" />
    </AppShell>
  )
}
