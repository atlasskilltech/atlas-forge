import { AppShell, ShellPlaceholder } from '@/components/layout'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Platform Overview',
  description: 'Super Admin read-only platform overview.',
  path: '/admin/overview',
  noIndex: true,
})

export default function AdminOverviewPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <ShellPlaceholder
        title="Platform Overview"
        note="Super Admin content is built in the Super Admin module section."
      />
    </AppShell>
  )
}
