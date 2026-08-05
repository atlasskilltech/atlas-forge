import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More Forge Manager options.',
  path: '/forge/more',
  noIndex: true,
})

export default function ForgeMorePage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <MoreTray role={ROLES.FORGE_MANAGER} />
    </AppShell>
  )
}
