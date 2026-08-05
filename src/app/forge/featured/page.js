import { AppShell } from '@/components/layout'
import { ProjectsGrid } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
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
export default function ForgeFeaturedPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>Featured</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Startups currently featured across ATLAS Forge.</Subtle>
      <ProjectsGrid only="featured" />
    </AppShell>
  )
}
