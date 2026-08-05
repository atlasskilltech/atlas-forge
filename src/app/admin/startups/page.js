import { AppShell } from '@/components/layout'
import { StartupsView } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Startups',
  description: 'Read-only view of all incubated startups under ATLAS Forge.',
  path: '/admin/startups',
  noIndex: true,
})

export default function AdminStartupsPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle>All Startups</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-5">
        Read-only view of all incubated startups under ATLAS Forge.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <StartupsView />
    </AppShell>
  )
}
