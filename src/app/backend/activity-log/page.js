import { AppShell } from '@/components/layout'
import { PlatformLogsTable } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
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
export default async function BackendActivityLogPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/activity-log')
  const { rows } = await backend.getAuditTable()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Activity Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Recent user activity across ATLAS Forge.</Subtle>
      <PlatformLogsTable rows={rows} caption="Recent user activity" />
    </AppShell>
  )
}
