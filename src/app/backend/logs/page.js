import { AppShell } from '@/components/layout'
import { PlatformLogsTable } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Logs',
  description: 'Full audit trail of all platform actions.',
  path: '/backend/logs',
  noIndex: true,
})

export default async function BackendLogsPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/logs')
  const { rows } = await backend.getAuditTable()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Platform Logs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Full audit trail of all platform actions. Immutable record for oversight and
        debugging.
      </Subtle>
      <PlatformLogsTable rows={rows} />
    </AppShell>
  )
}
