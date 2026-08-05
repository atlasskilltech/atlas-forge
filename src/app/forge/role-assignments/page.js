import { AppShell } from '@/components/layout'
import { UserAccountsTable } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Role Assignments',
  description: 'The role currently assigned to every ATLAS Forge account.',
  path: '/forge/role-assignments',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the User Accounts table, whose Role column is the subject here.
 */
export default function ForgeRoleAssignmentsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>Role Assignments</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">The role currently assigned to every ATLAS Forge account.</Subtle>
      <UserAccountsTable />
    </AppShell>
  )
}
