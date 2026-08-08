import { AppShell } from '@/components/layout'
import { OverviewView, ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
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
export default async function AdminSummaryPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/summary')
  const { stats, mobileStats, startups } = await admin.getOverview()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <PageTitle>Platform Summary</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Headline platform figures at a glance.</Subtle>
      <OverviewView stats={stats} mobileStats={mobileStats} startups={startups} />
      <ReadOnlyNote className="mt-5" />
    </AppShell>
  )
}
