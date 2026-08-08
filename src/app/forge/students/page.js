import { AppShell } from '@/components/layout'
import { UserAccountsTable } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Students',
  description: 'Every student registered on ATLAS Forge.',
  path: '/forge/students',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the User Accounts table (a designed screen) scoped to students.
 */
export default async function ForgeAllStudentsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/students')
  const { accounts, filters } = await forge.getUsers()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>All Students</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Every student registered on ATLAS Forge.</Subtle>
      <UserAccountsTable groups={['Students']} accounts={accounts} filters={filters} />
    </AppShell>
  )
}
