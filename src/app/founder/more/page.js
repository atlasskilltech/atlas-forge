import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More founder options.',
  path: '/founder/more',
  noIndex: true,
})

export default async function FounderMorePage() {
  const { chromeUser } = await founder.requireFounderPage('/founder/more')

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      <MoreTray role={ROLES.FOUNDER} />
    </AppShell>
  )
}
