import { AppShell } from '@/components/layout'
import { PlatformSettings } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Settings',
  description: 'Backend Manager only. Changes here affect all users across the platform.',
  path: '/backend/settings',
  noIndex: true,
})

export default async function BackendSettingsPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/settings')
  const { groups, mobile } = await backend.getSettings()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Platform Settings</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Backend Manager only. Changes here affect all users across the platform.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <PlatformSettings groups={groups} mobile={mobile} />
    </AppShell>
  )
}
