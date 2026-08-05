import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More Super Admin options.',
  path: '/admin/more',
  noIndex: true,
})

export default function AdminMorePage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN} viewOnlyBanner={false}>
      <MoreTray role={ROLES.SUPER_ADMIN} />
    </AppShell>
  )
}
