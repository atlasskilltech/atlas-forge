import { AppShell } from '@/components/layout'
import { ProjectsGrid } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Active Startups',
  description: 'Startups currently active under ATLAS Forge incubation.',
  path: '/forge/active-startups',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the All Projects grid, pre-filtered to active startups.
 */
export default function ForgeActiveStartupsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>Active Startups</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Startups currently active under ATLAS Forge incubation.</Subtle>
      <ProjectsGrid only="active" />
    </AppShell>
  )
}
