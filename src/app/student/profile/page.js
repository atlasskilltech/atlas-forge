import { AppShell } from '@/components/layout'
import { ProfilePanel } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Profile',
  description: 'Your ATLAS Forge student profile, skills and activity.',
  path: '/student/profile',
  noIndex: true,
})

export default async function StudentProfilePage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/profile')
  const { profile, stats } = await student.getProfile(userId)

  return (
    <AppShell role={ROLES.STUDENT} user={chromeUser}>
      <PageTitle className="mb-4">My Profile</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        Your profile is visible to Founders searching the Service pool and to the
        Forge Manager.
      </Subtle>
      <ProfilePanel profile={profile} stats={stats} />
    </AppShell>
  )
}
