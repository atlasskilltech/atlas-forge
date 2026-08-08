import { AppShell } from '@/components/layout'
import { SharedProfile } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge account, shared across all your roles.',
  path: '/backend/profile',
  noIndex: true,
})

export default async function BackendProfilePage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/profile')
  const { profile } = await backend.getProfile(user)

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        Your profile is visible to the Forge Manager. This information is shared across
        all your roles on ATLAS Forge.
      </Subtle>
      <SharedProfile profile={profile} endpoint="/api/backend/profile" />
    </AppShell>
  )
}
