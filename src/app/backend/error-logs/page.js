import { AppShell } from '@/components/layout'
import { PlatformLogsTable } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Error Logs',
  description: 'Platform errors and failed operations.',
  path: '/backend/error-logs',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the Platform Logs table scoped to actionable entries; the dashboard reports 0 platform errors.
 */
export default async function BackendErrorLogsPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/error-logs')
  const { rows } = await backend.getErrorLogs()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Error Logs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Platform errors and failed operations.</Subtle>
      <PlatformLogsTable rows={rows} caption="Platform errors and failed operations" />
    </AppShell>
  )
}
