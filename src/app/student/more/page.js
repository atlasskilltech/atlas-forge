import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More student options.',
  path: '/student/more',
  noIndex: true,
})

export default function StudentMorePage() {
  return (
    <AppShell role={ROLES.STUDENT}>
      <MoreTray role={ROLES.STUDENT} />
    </AppShell>
  )
}
