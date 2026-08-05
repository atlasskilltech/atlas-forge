import { AppShell } from '@/components/layout'
import { UserAccountsTable } from '@/components/forge'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'User Accounts',
  description: 'Every account registered on ATLAS Forge.',
  path: '/forge/user-accounts',
  noIndex: true,
})

export default function ForgeUserAccountsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle className="mb-4 lg:mb-5">User Accounts</PageTitle>
      <UserAccountsTable />
    </AppShell>
  )
}
