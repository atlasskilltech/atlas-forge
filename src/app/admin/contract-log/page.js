import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { ReadOnlyNote } from '@/components/admin'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as admin from '@/lib/modules/admin'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contract Log',
  description: 'Engagements agreed between founders and students.',
  path: '/admin/contract-log',
  noIndex: true,
})

/**
 * NOTE: No SA frame exists. Reuses the Contact Log table, which carries the same engagement columns.
 */
export default async function AdminContractLogPage() {
  const { chromeUser } = await admin.requireAdminPage('/admin/contract-log')
  const { rows, stats } = await admin.getContracts()

  return (
    <AppShell role={ROLES.SUPER_ADMIN} user={chromeUser}>
      <PageTitle>Contract Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-5">Engagements agreed between founders and students.</Subtle>
      <AllContactsView
        contacts={rows}
        stats={stats}
        caption="Engagements agreed between founders and students"
      />
      <ReadOnlyNote className="mt-5" />
    </AppShell>
  )
}
