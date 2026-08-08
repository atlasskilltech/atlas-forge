import { AppShell } from '@/components/layout'
import { AllUsersTable } from '@/components/backend'
import { Chip } from '@/components/ui'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'All Users',
  description: 'Every account registered on ATLAS Forge.',
  path: '/backend/users',
  noIndex: true,
})

export default async function BackendUsersPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/users')
  const { users, filters, counts } = await backend.getUsers()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
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
      <AllUsersTable users={users} filters={filters} />
    </AppShell>
  )
}
