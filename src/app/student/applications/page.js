import { AppShell } from '@/components/layout'
import { ApplicationList } from '@/components/student'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Applications',
  description: 'Track the status of every role you have applied to.',
  path: '/student/applications',
  noIndex: true,
})

export default function StudentApplicationsPage() {
  return (
    <AppShell role={ROLES.STUDENT}>
      <PageTitle className="mb-4 lg:mb-[22px]">My Applications</PageTitle>
      <ApplicationList />
    </AppShell>
  )
}
