import { AppShell } from '@/components/layout'
import { StartupsView } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Startups',
  description: 'Read-only view of all incubated startups under ATLAS Forge.',
  path: '/admin/startups',
  noIndex: true,
})

export default async function AdminStartupsPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/startups')
  const { startups, stats } = await admin.getStartups()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <PageTitle>All Startups</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-5">
        Read-only view of all incubated startups under ATLAS Forge.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <StartupsView startups={startups} stats={stats} />
    </AppShell>
  )
}
