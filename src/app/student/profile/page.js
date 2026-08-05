import { AppShell } from '@/components/layout'
import { ProfilePanel } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge student profile, skills and activity.',
  path: '/student/profile',
  noIndex: true,
})

export default function StudentProfilePage() {
  return (
    <AppShell role={ROLES.STUDENT}>
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        Your profile is visible to Founders searching the Concierge pool and to the
        Forge Manager.
      </Subtle>
      <ProfilePanel />
    </AppShell>
  )
}
