import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More founder options.',
  path: '/founder/more',
  noIndex: true,
})

export default function FounderMorePage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <MoreTray role={ROLES.FOUNDER} />
    </AppShell>
  )
}
