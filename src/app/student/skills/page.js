import { AppShell } from '@/components/layout'
import { AvailabilityPanel } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Skills Profile',
  description: 'Manage the skills founders see when they search the Service pool.',
  path: '/student/skills',
  noIndex: true,
})

/**
 * The sidebar lists "Flag My Availability" and "My Skills Profile" separately,
 * but the reference draws a single screen ("My Service Profile") containing
 * both. This route renders that same screen so either entry point works and the
 * sidebar highlights correctly.
 */
export default async function StudentSkillsPage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/skills')
  const { profile } = await student.getAvailability(userId)

  return (
    <AppShell
      role={ROLES.STUDENT}
      user={chromeUser}
      mobileTitle="My Skills Profile"
      backHref="/student/home"
    >
      <PageTitle>My Skills Profile</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Control your availability and skills profile. Founders search this pool to find
        collaborators.
      </Subtle>
      <AvailabilityPanel profile={profile} />
    </AppShell>
  )
}
