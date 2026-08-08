import { AppShell } from '@/components/layout'
import { UserAccountsTable } from '@/components/forge'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'User Accounts',
  description: 'Every account registered on ATLAS Forge.',
  path: '/forge/user-accounts',
  noIndex: true,
})

export default async function ForgeUserAccountsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/user-accounts')
  const { accounts, filters } = await forge.getUsers()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle className="mb-4 lg:mb-5">User Accounts</PageTitle>
      <UserAccountsTable accounts={accounts} filters={filters} />
    </AppShell>
  )
}
