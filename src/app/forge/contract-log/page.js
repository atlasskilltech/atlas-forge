import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contract Log',
  description: 'Engagements agreed between founders and students.',
  path: '/forge/contract-log',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Reuses the Contact Log table, which carries the same engagement columns.
 */
export default async function ForgeContractLogPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/contract-log')
  const { rows, stats } = await forge.getContracts()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>Contract Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Engagements agreed between founders and students.</Subtle>
      {/* The Contract Log reuses the Contact Log table — same columns — but
          its rows are the engagements actually agreed, not the outreach. */}
      <AllContactsView
        contacts={rows}
        stats={stats}
        caption="Engagements agreed between founders and students"
      />
    </AppShell>
  )
}
