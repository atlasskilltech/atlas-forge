import { AppShell } from '@/components/layout'
import { OverviewView } from '@/components/admin'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Overview',
  description: 'Read-only visibility across the entire ATLAS Forge platform.',
  path: '/admin/overview',
  noIndex: true,
})

export default async function AdminOverviewPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/overview')
  const { stats, mobileStats, startups } = await admin.getOverview()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <PageTitle className="mb-4 lg:mb-5">Platform Overview</PageTitle>
      <OverviewView stats={stats} mobileStats={mobileStats} startups={startups} />
    </AppShell>
  )
}
