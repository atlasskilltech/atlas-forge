import { AppShell } from '@/components/layout'
import { HelpTopics } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Help',
  description: 'Guidance on using ATLAS Forge as a student.',
  path: '/student/help',
  noIndex: true,
})

/** See HelpTopics — no Help screen exists in the reference set. */
const TOPICS = [
  {
    title: 'Flagging your availability',
    detail:
      'Set your hours and work types so founders searching the Concierge pool can find you.',
    href: '/student/availability',
  },
  {
    title: 'Applying to roles',
    detail:
      'Browse jobs and collabs from incubated startups, then track every application in one place.',
    href: '/student/jobs',
  },
  {
    title: 'Mentorship sessions',
    detail:
      'Mihir Pawar reviews every request and matches you with a Faculty, Alumni or Industry mentor.',
    href: '/student/mentorship',
  },
  {
    title: 'Applying for incubation',
    detail:
      'Submit your idea, current stage and readiness materials for the ATLAS Forge programme.',
    href: '/student/incubation',
  },
]

export default function StudentHelpPage() {
  return (
    <AppShell role={ROLES.STUDENT} mobileTitle="Help" backHref="/student/home">
      <PageTitle className="mb-4">Help</PageTitle>
      <Subtle className="mt-3 mb-[22px] text-sm">
        Common questions about using ATLAS Forge as a student.
      </Subtle>
      <HelpTopics topics={TOPICS} />
    </AppShell>
  )
}
