import { redirect } from 'next/navigation'
import RoleSwitcher from '@/components/auth/RoleSwitcher'
import { AppShell } from '@/components/layout'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { requireIdentityOrRedirect } from '@/lib/auth/guard'
import { actAsRoleOptions } from '@/lib/auth/act-as-options'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Switch Role',
  description: 'Backend Manager: take on any role.',
  path: '/backend/switch-role',
  noIndex: true,
})

/**
 * Backend Manager power: take on any of the five roles. After switching, the
 * whole platform treats the Backend Manager exactly as that role (dashboard,
 * menus, permissions, limits) until they switch again from this page, which
 * stays in their menu in every role. The account's role in the database stays
 * Backend Manager.
 *
 * Opens only for a user whose REAL role is Backend Manager — whichever role
 * they are currently switched to. Everyone else is sent to their own home.
 */
export default async function SwitchRolePage() {
  const identity = await requireIdentityOrRedirect('/backend/switch-role')
  const realRole = identity.realRole ?? identity.defaultRole
  if (realRole?.slug !== ROLES.BACKEND_MANAGER) redirect('/select-role')

  const current = identity.defaultRole?.slug ?? ROLES.BACKEND_MANAGER
  const chromeUser = { name: identity.user.name, initials: identity.user.initials }

  return (
    <AppShell role={current} user={chromeUser}>
      <PageTitle>Switch Role</PageTitle>
      <Subtle className="mt-3 mb-5 text-sm">
        As Backend Manager you can take on any role. You then get exactly that role&apos;s
        dashboard, menus and permissions. Come back to this page from the menu at any time to
        switch again or return to Backend Manager. Actions are recorded under your own account.
      </Subtle>
      <RoleSwitcher roles={actAsRoleOptions()} current={current} />
    </AppShell>
  )
}
