import { AppShell } from '@/components/layout'
import { SessionLogList } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Session Log',
  description: 'Every mentorship session across ATLAS Forge.',
  path: '/forge/session-log',
  noIndex: true,
})

/**
 * NOTE: No standalone frame. Reuses the SESSION LOG panel drawn inside Assign Mentors.
 */
export default async function ForgeSessionLogPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/session-log')
  const { sessionLog } = await forge.getMentorship()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>Session Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Every mentorship session across ATLAS Forge.</Subtle>
      <SessionLogList sessions={sessionLog} />
    </AppShell>
  )
}
