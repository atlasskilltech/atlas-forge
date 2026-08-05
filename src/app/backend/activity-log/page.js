import { AppShell } from '@/components/layout'
import { PlatformLogsTable } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Activity Log',
  description: 'Recent user activity across ATLAS Forge.',
  path: '/backend/activity-log',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the Platform Logs audit table, which is the same record.
 */
export default function BackendActivityLogPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Activity Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Recent user activity across ATLAS Forge.</Subtle>
      <PlatformLogsTable />
    </AppShell>
  )
}
