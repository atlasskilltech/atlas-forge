import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More Forge Manager options.',
  path: '/forge/more',
  noIndex: true,
})

export default async function ForgeMorePage() {
  const { chromeUser } = await forge.requireForgePage('/forge/more')

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <MoreTray role={ROLES.FORGE_MANAGER} />
    </AppShell>
  )
}
