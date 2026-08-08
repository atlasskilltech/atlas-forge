import { AppShell } from '@/components/layout'
import { SimpleLogList } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
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
export default async function ForgePlatformLogsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/platform-logs')
  const { logs } = await forge.getPlatformLogs()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>Platform Logs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Recent platform activity across ATLAS Forge.</Subtle>
      <SimpleLogList items={logs} showDot />
    </AppShell>
  )
}
