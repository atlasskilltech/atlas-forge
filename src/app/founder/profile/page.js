import { AppShell } from '@/components/layout'
import { ProfileForm } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge founder profile and account details.',
  path: '/founder/profile',
  noIndex: true,
})

export default function FounderProfilePage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        Your profile is visible to the Forge Manager. Update your details and manage your
        account.
      </Subtle>
      <ProfileForm />
    </AppShell>
  )
}
