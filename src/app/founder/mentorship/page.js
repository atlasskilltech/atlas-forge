import { AppShell } from '@/components/layout'
import { MentorshipPanel } from '@/components/founder'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Mentorship',
  description: 'Your assigned mentor and mentorship sessions.',
  path: '/founder/mentorship',
  noIndex: true,
})

export default async function FounderMentorshipPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/mentorship')
  const { mentor, sessions, upcoming, mentorTypes } = await founder.getMentorship(user)

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      <PageTitle className="mb-4 lg:mb-[22px]">Mentorship</PageTitle>
      <MentorshipPanel
        mentor={mentor}
        sessions={sessions}
        upcoming={upcoming}
        mentorTypes={mentorTypes}
      />
    </AppShell>
  )
}
