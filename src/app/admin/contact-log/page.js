import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Log',
  description: 'Every contact made by founders through Service.',
  path: '/admin/contact-log',
  noIndex: true,
})

/**
 * NOTE: No SA frame exists. Reuses the Contact Log table; actions are unavailable to this role, so it closes with the read-only note.
 */
export default async function AdminContactLogPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/contact-log')
  const { rows, stats } = await admin.getContacts()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <PageTitle>Contact Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Every contact made by founders through Service.</Subtle>
      <AllContactsView contacts={rows} stats={stats} />
      <ReadOnlyNote className="mt-5" />
    </AppShell>
  )
}
