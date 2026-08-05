import { AppShell } from '@/components/layout'
import { RoleManagement } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Grant Founder Access',
  description: 'Find a student and grant them Founder access.',
  path: '/backend/grant-access',
  noIndex: true,
})

/**
 * NOTE: No dedicated frame. Renders the Role Management screen with the grant flow leading.
 */
export default function BackendGrantAccessPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Grant Founder Access</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Find a student and grant them Founder access.</Subtle>
      <RoleManagement focus="grant" />
    </AppShell>
  )
}
