import { AppShell } from '@/components/layout'
import { ProjectBrowser } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Browse Projects',
  description: 'Explore all startups incubated under ATLAS Forge.',
  path: '/student/projects',
  noIndex: true,
})

export default function StudentProjectsPage() {
  return (
    <AppShell role={ROLES.STUDENT}>
      <PageTitle>Browse Projects</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Explore all startups incubated under ATLAS Forge. Find teams to work with or
        apply to.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <ProjectBrowser />
      </div>
    </AppShell>
  )
}
