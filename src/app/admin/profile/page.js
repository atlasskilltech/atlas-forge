import { AppShell } from '@/components/layout'
import { SharedProfile } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge account, shared across all your roles.',
  path: '/admin/profile',
  noIndex: true,
})

/**
 * NOTE: Uses the Shared My Profile design, which the reference set provides for the manager roles.
 */
export default function AdminProfilePage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN} viewOnlyBanner={false}>
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        This information is shared across all your roles on ATLAS Forge.
      </Subtle>
      <SharedProfile />
    </AppShell>
  )
}
