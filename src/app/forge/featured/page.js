import { AppShell } from '@/components/layout'
import { ProjectsGrid } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Featured',
  description: 'Startups currently featured across ATLAS Forge.',
  path: '/forge/featured',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the All Projects grid, pre-filtered to featured startups.
 */
export default async function ForgeFeaturedPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/featured')
  const { projects, filters } = await forge.getProjects()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>Featured</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Startups currently featured across ATLAS Forge.</Subtle>
      <ProjectsGrid only="featured" projects={projects} filters={filters} />
    </AppShell>
  )
}
