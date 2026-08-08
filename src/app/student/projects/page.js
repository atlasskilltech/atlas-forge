import { AppShell } from '@/components/layout'
import { ProjectBrowser } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Browse Projects',
  description: 'Explore all startups incubated under ATLAS Forge.',
  path: '/student/projects',
  noIndex: true,
})

export default async function StudentProjectsPage() {
  const { chromeUser } = await student.requireStudentPage('/student/projects')
  const { projects, filters } = await student.getProjects()

  return (
    <AppShell role={ROLES.STUDENT} user={chromeUser}>
      <PageTitle>Browse Projects</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Explore all startups incubated under ATLAS Forge. Find teams to work with or
        apply to.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <ProjectBrowser projects={projects} filters={filters} />
      </div>
    </AppShell>
  )
}
