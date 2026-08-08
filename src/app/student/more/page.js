import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More student options.',
  path: '/student/more',
  noIndex: true,
})

export default async function StudentMorePage() {
  const { chromeUser } = await student.requireStudentPage('/student/more')

  return (
    <AppShell role={ROLES.STUDENT} user={chromeUser}>
      <MoreTray role={ROLES.STUDENT} />
    </AppShell>
  )
}
