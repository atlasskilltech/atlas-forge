import { AppShell } from '@/components/layout'
import { IncubationForm } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Apply for Incubation',
  description: 'Apply to the ATLAS Forge incubation programme.',
  path: '/student/incubation',
  noIndex: true,
})

export default function StudentIncubationPage() {
  return (
    <AppShell
      role={ROLES.STUDENT}
      mobileTitle="Apply for Incubation"
      backHref="/student/home"
    >
      <PageTitle>Apply for Incubation</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        ATLAS Forge incubation — for ATLAS SkillTech University students and teams
      </Subtle>
      <IncubationForm />
    </AppShell>
  )
}
