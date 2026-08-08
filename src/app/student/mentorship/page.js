import { AppShell } from '@/components/layout'
import { MentorshipPanel } from '@/components/student'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Mentorship',
  description: 'View your assigned mentor and request mentorship sessions.',
  path: '/student/mentorship',
  noIndex: true,
})

export default async function StudentMentorshipPage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/mentorship')
  const { sessions, assignedMentor, mentorTypes } = await student.getMentorship(userId)

  return (
    <AppShell role={ROLES.STUDENT} user={chromeUser}>
      <PageTitle>Mentorship</PageTitle>
      <Subtle className="mt-4 mb-[22px] hidden text-sm lg:block">
        Sessions are assigned by Mihir Pawar. Faculty and Alumni mentors available for
        special needs.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <MentorshipPanel
          sessions={sessions}
          assignedMentor={assignedMentor}
          mentorTypes={mentorTypes}
        />
      </div>
    </AppShell>
  )
}
