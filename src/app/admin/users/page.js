import { AppShell } from '@/components/layout'
import { UsersView } from '@/components/admin'
import { Chip } from '@/components/ui'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Users',
  description: 'Every account registered on ATLAS Forge.',
  path: '/admin/users',
  noIndex: true,
})

export default async function AdminUsersPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/users')
  const { users, filters, counts } = await admin.getUsers()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 lg:mb-5">
        <PageTitle>All Users</PageTitle>
        <div className="hidden shrink-0 gap-2.5 lg:flex">
          {counts.map((count) => (
            <Chip key={count.label} tone={count.tone} size="lg" className="h-[26px]">
              {count.label}
            </Chip>
          ))}
        </div>
      </div>
      <UsersView users={users} filters={filters} />
    </AppShell>
  )
}
