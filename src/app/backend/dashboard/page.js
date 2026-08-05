import { AppShell, ShellPlaceholder } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Dashboard',
  description: 'Backend Manager platform dashboard.',
  path: '/backend/dashboard',
  noIndex: true,
})

export default function BackendDashboardPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <ShellPlaceholder
        title="Platform Dashboard"
        note="Backend Manager content is built in the Backend Manager module section."
      />
    </AppShell>
  )
}
