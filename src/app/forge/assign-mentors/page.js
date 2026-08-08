import { AppShell } from '@/components/layout'
import { MentorAssignment } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Assign Mentors',
  description: 'Match students and founders to Faculty, Alumni and Industry mentors.',
  path: '/forge/assign-mentors',
  noIndex: true,
})

export default async function ForgeAssignMentorsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/assign-mentors')
  const { requests, mentors, sessionLog, mobileAssignments } = await forge.getMentorship()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle className="mb-4 lg:mb-[22px]">
        <span className="lg:hidden">Assign Mentors</span>
        <span className="hidden lg:inline">Mentorship Management</span>
      </PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:hidden">
        Match students to startup mentors.
      </Subtle>
      <MentorAssignment
        requests={requests}
        mentors={mentors}
        sessionLog={sessionLog}
        mobileAssignments={mobileAssignments}
      />
    </AppShell>
  )
}
