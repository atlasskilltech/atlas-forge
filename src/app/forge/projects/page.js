import { AppShell } from '@/components/layout'
import { ProjectsGrid } from '@/components/forge'
import { Button, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Projects Under Forge',
  description: 'All incubated startups registered under ATLAS Forge.',
  path: '/forge/projects',
  noIndex: true,
})

export default function ForgeProjectsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>
          <span className="lg:hidden">All Projects</span>
          <span className="hidden lg:inline">All Projects Under Forge</span>
        </PageTitle>
        <Button variant="secondary" size="lg" className="hidden shrink-0 lg:inline-flex">
          + Feature a Project
        </Button>
      </div>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        All incubated startups registered under ATLAS Forge. Manage visibility and
        featured status.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <ProjectsGrid />
      </div>
    </AppShell>
  )
}
