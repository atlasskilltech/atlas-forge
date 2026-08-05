import { AppShell } from '@/components/layout'
import { ActivityReport } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Activity Report',
  description: 'Platform-wide activity summary. Read-only.',
  path: '/admin/activity-report',
  noIndex: true,
})

export default function AdminActivityReportPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle>Activity Report</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-5">
        Platform-wide activity summary. Read-only. Export available via Backend Manager.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <ActivityReport />
    </AppShell>
  )
}
