import { AppShell } from '@/components/layout'
import { MentorshipPanel } from '@/components/founder'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Mentorship',
  description: 'Your assigned mentor and mentorship sessions.',
  path: '/founder/mentorship',
  noIndex: true,
})

export default function FounderMentorshipPage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <PageTitle className="mb-4 lg:mb-[22px]">Mentorship</PageTitle>
      <MentorshipPanel />
    </AppShell>
  )
}
