import { AppShell } from '@/components/layout'
import { SharedProfile } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { requireRoleOrRedirect } from '@/lib/auth/guard'
import { getSharedProfile } from '@/lib/modules/shared'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge account, shared across all your roles.',
  path: '/admin/profile',
  noIndex: true,
})

/**
 * NOTE: Uses the Shared My Profile design, which the reference set provides for the manager roles.
 *
 * Converted ahead of the rest of the Super Admin module because it renders the
 * same component as the Backend Manager's profile. No `endpoint` is passed:
 * Super Admin is view-only, so Save is disabled rather than silently inert.
 */
export default async function AdminProfilePage() {
  const identity = await requireRoleOrRedirect('super-admin', '/admin/profile')
  const { profile } = await getSharedProfile(identity.user)

  return (
    <AppShell
      role={ROLES.SUPER_ADMIN}
      user={{ name: identity.user.name, initials: identity.user.initials }}
      viewOnlyBanner={false}
    >
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        This information is shared across all your roles on ATLAS Forge.
      </Subtle>
      <SharedProfile profile={profile} />
    </AppShell>
  )
}
