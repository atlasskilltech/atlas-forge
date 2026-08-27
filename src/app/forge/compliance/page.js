import { AppShell } from '@/components/layout'
import { ComplianceOverview } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Compliance & Documents',
  description: 'Document completeness across every startup in the programme.',
  path: '/forge/compliance',
  noIndex: true,
})

export default async function ForgeCompliancePage() {
  const { chromeUser } = await forge.requireForgePage('/forge/compliance')
  const { startups, total, coreTotal } = await forge.getComplianceOverview()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser} mobileTitle="Compliance & Docs">
      <PageTitle>Compliance &amp; Documents</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Which startups have their paperwork in order. Open one to read or download its
        documents.
      </Subtle>
      <ComplianceOverview startups={startups} total={total} coreTotal={coreTotal} />
    </AppShell>
  )
}
