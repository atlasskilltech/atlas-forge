import { AppShell } from '@/components/layout'
import { PlatformLogsTable } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
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
export default function BackendErrorLogsPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Error Logs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Platform errors and failed operations.</Subtle>
      <PlatformLogsTable modules={['Hiring']} />
    </AppShell>
  )
}
