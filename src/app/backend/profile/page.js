import { AppShell } from '@/components/layout'
import { SharedProfile } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge account, shared across all your roles.',
  path: '/backend/profile',
  noIndex: true,
})

export default function BackendProfilePage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        Your profile is visible to the Forge Manager. This information is shared across
        all your roles on ATLAS Forge.
      </Subtle>
      <SharedProfile />
    </AppShell>
  )
}
