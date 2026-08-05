import { AppShell } from '@/components/layout'
import { JobBrowser } from '@/components/student'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Browse Jobs',
  description: 'Browse open roles and collaborations across ATLAS Forge startups.',
  path: '/student/jobs',
  noIndex: true,
})

export default function StudentJobsPage() {
  return (
    <AppShell role={ROLES.STUDENT}>
      <PageTitle className="mb-4 lg:mb-[22px]">
        <span className="lg:hidden">Browse Jobs</span>
        <span className="hidden lg:inline">Browse Jobs &amp; Collabs</span>
      </PageTitle>
      <JobBrowser />
    </AppShell>
  )
}
