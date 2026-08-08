import { AppShell } from '@/components/layout'
import { ActivityReport } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Activity Report',
  description: 'Platform-wide activity summary. Read-only.',
  path: '/admin/activity-report',
  noIndex: true,
})

export default async function AdminActivityReportPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/activity-report')
  const { stats, events, mobileEvents, range } = await admin.getActivityReport()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <PageTitle>Activity Report</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-5">
        Platform-wide activity summary. Read-only. Export available via Backend Manager.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <ActivityReport
        stats={stats}
        events={events}
        mobileEvents={mobileEvents}
        range={range}
      />
    </AppShell>
  )
}
