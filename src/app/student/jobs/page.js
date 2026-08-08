import { AppShell } from '@/components/layout'
import { JobBrowser } from '@/components/student'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Browse Jobs',
  description: 'Browse open roles and collaborations across ATLAS Forge startups.',
  path: '/student/jobs',
  noIndex: true,
})

export default async function StudentJobsPage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/jobs')
  const { jobs, filters } = await student.getJobs(userId)

  return (
    <AppShell role={ROLES.STUDENT} user={chromeUser}>
      <PageTitle className="mb-4 lg:mb-[22px]">
        <span className="lg:hidden">Browse Jobs</span>
        <span className="hidden lg:inline">Browse Jobs &amp; Collabs</span>
      </PageTitle>
      <JobBrowser jobs={jobs} filters={filters} />
    </AppShell>
  )
}
