import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
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
export default function BackendContractLogPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Contract Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Engagements agreed between founders and students.</Subtle>
      <AllContactsView />
    </AppShell>
  )
}
