import { AppShell } from '@/components/layout'
import { UsersView } from '@/components/admin'
import { Chip } from '@/components/ui'
import { userCounts } from '@/data/admin'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Users',
  description: 'Every account registered on ATLAS Forge.',
  path: '/admin/users',
  noIndex: true,
})

export default function AdminUsersPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3 lg:mb-5">
        <PageTitle>All Users</PageTitle>
        <div className="hidden shrink-0 gap-2.5 lg:flex">
          {userCounts.map((count) => (
            <Chip key={count.label} tone={count.tone} size="lg" className="h-[26px]">
              {count.label}
            </Chip>
          ))}
        </div>
      </div>
      <UsersView />
    </AppShell>
  )
}
