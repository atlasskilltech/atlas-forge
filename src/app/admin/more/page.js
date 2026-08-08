import { AppShell, MoreTray } from '@/components/layout'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'More',
  description: 'More Super Admin options.',
  path: '/admin/more',
  noIndex: true,
})

export default async function AdminMorePage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/more')

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser} viewOnlyBanner={false}>
      <MoreTray role={ROLES.SUPER_ADMIN} />
    </AppShell>
  )
}
