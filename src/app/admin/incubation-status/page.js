import { AppShell } from '@/components/layout'
import { StartupsView, ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Incubation Status',
  description: 'Incubation stage and status for every registered startup.',
  path: '/admin/incubation-status',
  noIndex: true,
})

/**
 * NOTE: No SA frame exists. Reuses the All Startups table, whose Stage and Status columns are the subject here.
 */
export default function AdminIncubationStatusPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle>Incubation Status</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Incubation stage and status for every registered startup.</Subtle>
      <StartupsView />
      <ReadOnlyNote className="mt-5 lg:hidden" />
    </AppShell>
  )
}
