import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contract Log',
  description: 'Engagements agreed between founders and students.',
  path: '/backend/contract-log',
  noIndex: true,
})

/**
 * NOTE: No BM frame exists. Reuses the Contact Log table, which carries the same engagement columns.
 */
export default async function BackendContractLogPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/contract-log')
  const { rows, stats } = await backend.getContracts()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Contract Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Engagements agreed between founders and students.</Subtle>
      <AllContactsView
        contacts={rows}
        stats={stats}
        caption="Engagements agreed between founders and students"
      />
    </AppShell>
  )
}
