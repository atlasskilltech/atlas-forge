import { AppShell, ShellPlaceholder } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Dashboard',
  description: 'Forge Manager dashboard.',
  path: '/forge/dashboard',
  noIndex: true,
})

export default function ForgeDashboardPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <ShellPlaceholder
        title="Forge Manager Dashboard"
        note="Forge Manager content is built in the Forge Manager module section."
      />
    </AppShell>
  )
}
