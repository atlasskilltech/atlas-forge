import { AppShell } from '@/components/layout'
import { OverviewView } from '@/components/admin'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Overview',
  description: 'Read-only visibility across the entire ATLAS Forge platform.',
  path: '/admin/overview',
  noIndex: true,
})

export default function AdminOverviewPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle className="mb-4 lg:mb-5">Platform Overview</PageTitle>
      <OverviewView />
    </AppShell>
  )
}
