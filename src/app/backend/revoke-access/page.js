import { AppShell } from '@/components/layout'
import { RoleManagement } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Revoke Access',
  description: 'Revoke Founder access and revert an account to Standard Student.',
  path: '/backend/revoke-access',
  noIndex: true,
})

/**
 * NOTE: No dedicated frame. Renders the Role Management screen with the revoke flow leading.
 */
export default function BackendRevokeAccessPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Revoke Access</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Revoke Founder access and revert an account to Standard Student.</Subtle>
      <RoleManagement focus="revoke" />
    </AppShell>
  )
}
