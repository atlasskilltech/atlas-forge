import { AppShell } from '@/components/layout'
import { PlatformLogsTable } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Logs',
  description: 'Full audit trail of all platform actions.',
  path: '/backend/logs',
  noIndex: true,
})

export default function BackendLogsPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Platform Logs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Full audit trail of all platform actions. Immutable record for oversight and
        debugging.
      </Subtle>
      <PlatformLogsTable />
    </AppShell>
  )
}
