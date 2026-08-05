import { AppShell } from '@/components/layout'
import { SimpleLogList } from '@/components/forge'
import { platformLogs } from '@/data/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Logs',
  description: 'Recent platform activity across ATLAS Forge.',
  path: '/forge/platform-logs',
  noIndex: true,
})

/**
 * NOTE: No FM frame exists. Uses the activity-row treatment drawn on the BM Platform Dashboard.
 */
export default function ForgePlatformLogsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>Platform Logs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Recent platform activity across ATLAS Forge.</Subtle>
      <SimpleLogList items={platformLogs} showDot />
    </AppShell>
  )
}
