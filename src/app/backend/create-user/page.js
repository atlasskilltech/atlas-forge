import { AppShell } from '@/components/layout'
import { CreateStaffUser } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Create Staff User',
  description: 'Provision a new staff account on ATLAS Forge.',
  path: '/backend/create-user',
  noIndex: true,
})

export default async function BackendCreateUserPage() {
  const { chromeUser } = await backend.requireBackendPage('/backend/create-user')
  const { roles } = await backend.getCreateStaffForm()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Create Staff User</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Add a Forge Manager, Backend Manager or Super Admin account.
      </Subtle>
      <CreateStaffUser roles={roles} />
    </AppShell>
  )
}
