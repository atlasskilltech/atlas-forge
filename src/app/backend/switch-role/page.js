import ActAsSwitcher from '@/components/auth/ActAsSwitcher'
import { AppShell } from '@/components/layout'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { actAsRoleOptions } from '@/lib/auth/act-as-options'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Switch Role (Testing)',
  description: 'Use the platform exactly as another role, for testing.',
  path: '/backend/switch-role',
  noIndex: true,
})

/**
 * Backend Manager testing mode. Choosing a role makes the whole app treat you
 * exactly as that role — its dashboard, menus, permissions and limits — until
 * you press "Back to Backend Manager" in the banner shown on every page. Your
 * real role in the database stays Backend Manager throughout.
 */
export default async function BackendSwitchRolePage() {
  const { chromeUser } = await backend.requireBackendPage('/backend/switch-role')

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Switch Role (Testing)</PageTitle>
      <Subtle className="mt-3 mb-5 text-sm">
        Use the platform exactly as another role would: the same dashboard, menus, permissions and
        limits. A banner on every page lets you switch back. Your account stays a Backend Manager.
        Anything you do while switched is real and is saved under your own account, so use test
        data.
      </Subtle>
      <ActAsSwitcher variant="cards" roles={actAsRoleOptions()} />
    </AppShell>
  )
}
