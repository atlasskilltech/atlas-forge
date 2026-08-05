import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { ProjectsGrid } from '@/components/founder'
import { Button, PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Projects Under Forge',
  description: 'Every startup incubated under ATLAS Forge.',
  path: '/founder/projects',
  noIndex: true,
})

export default function FounderProjectsPage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <div className="mb-4 flex items-start justify-between gap-4 lg:mb-[22px]">
        <PageTitle>
          <span className="lg:hidden">Projects</span>
          <span className="hidden lg:inline">Projects Under Forge</span>
        </PageTitle>
        <Button
          as={Link}
          href="/founder/edit-listing"
          variant="secondary"
          size="lg"
          className="hidden lg:inline-flex"
        >
          Edit My Listing
        </Button>
      </div>
      <ProjectsGrid />
    </AppShell>
  )
}
