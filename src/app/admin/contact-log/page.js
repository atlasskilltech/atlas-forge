import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Log',
  description: 'Every contact made by founders through Concierge.',
  path: '/admin/contact-log',
  noIndex: true,
})

/**
 * NOTE: No SA frame exists. Reuses the Contact Log table; actions are unavailable to this role, so it closes with the read-only note.
 */
export default function AdminContactLogPage() {
  return (
    <AppShell role={ROLES.SUPER_ADMIN}>
      <PageTitle>Contact Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Every contact made by founders through Concierge.</Subtle>
      <AllContactsView />
      <ReadOnlyNote className="mt-5" />
    </AppShell>
  )
}
