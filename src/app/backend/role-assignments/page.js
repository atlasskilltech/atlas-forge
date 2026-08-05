import { AppShell } from '@/components/layout'
import { RoleManagement } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Role Management',
  description: 'Grant or revoke Founder access across the platform.',
  path: '/backend/role-assignments',
  noIndex: true,
})

export default function BackendRoleAssignmentsPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>
        <span className="lg:hidden">Role Assignments</span>
        <span className="hidden lg:inline">Role Management</span>
      </PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Grant or revoke Founder access. Founders can post jobs, use Concierge, and
        manage their startup listing.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <RoleManagement />
    </AppShell>
  )
}
