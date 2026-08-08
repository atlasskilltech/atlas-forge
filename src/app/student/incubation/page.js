import { AppShell } from '@/components/layout'
import { IncubationForm } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Apply for Incubation',
  description: 'Apply to the ATLAS Forge incubation programme.',
  path: '/student/incubation',
  noIndex: true,
})

export default async function StudentIncubationPage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/incubation')
  const { stages, readinessItems } = await student.getIncubation(userId)

  return (
    <AppShell
      role={ROLES.STUDENT}
      user={chromeUser}
      mobileTitle="Apply for Incubation"
      backHref="/student/home"
    >
      <PageTitle>Apply for Incubation</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        ATLAS Forge incubation — for ATLAS SkillTech University students and teams
      </Subtle>
      <IncubationForm stages={stages} readinessItems={readinessItems} />
    </AppShell>
  )
}
