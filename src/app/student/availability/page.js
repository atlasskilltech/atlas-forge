import { AppShell } from '@/components/layout'
import { AvailabilityPanel } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Flag My Availability',
  description: 'Control your availability and skills profile in the Concierge pool.',
  path: '/student/availability',
  noIndex: true,
})

/**
 * Reference names this "My Concierge Profile" on desktop and
 * "Flag My Availability" on mobile — both titles are preserved.
 */
export default async function StudentAvailabilityPage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/availability')
  const { profile } = await student.getAvailability(userId)

  return (
    <AppShell
      role={ROLES.STUDENT}
      user={chromeUser}
      mobileTitle="Flag My Availability"
      backHref="/student/home"
    >
      <PageTitle>
        <span className="lg:hidden">Flag My Availability</span>
        <span className="hidden lg:inline">My Concierge Profile</span>
      </PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        <span className="lg:hidden">Let founders know you&apos;re open to work.</span>
        <span className="hidden lg:inline">
          Control your availability and skills profile. Founders search this pool to
          find collaborators.
        </span>
      </Subtle>
      <AvailabilityPanel profile={profile} />
    </AppShell>
  )
}
