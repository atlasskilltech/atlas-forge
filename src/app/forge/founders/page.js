import { AppShell } from '@/components/layout'
import { UserAccountsTable } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Founders',
  description: 'Every founder with unlocked access on ATLAS Forge.',
  path: '/forge/founders',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the User Accounts table scoped to founders.
 */
export default async function ForgeAllFoundersPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/founders')
  const { accounts, filters } = await forge.getUsers()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>All Founders</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Every founder with unlocked access on ATLAS Forge.</Subtle>
      <UserAccountsTable groups={['Founders']} accounts={accounts} filters={filters} />
    </AppShell>
  )
}
