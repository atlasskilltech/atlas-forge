import { AppShell } from '@/components/layout'
import { PlatformSettings } from '@/components/backend'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Settings',
  description: 'Backend Manager only. Changes here affect all users across the platform.',
  path: '/backend/settings',
  noIndex: true,
})

export default function BackendSettingsPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Platform Settings</PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Backend Manager only. Changes here affect all users across the platform.
      </Subtle>
      <div className="mt-4 lg:hidden" />
      <PlatformSettings />
    </AppShell>
  )
}
