import { AppShell } from '@/components/layout'
import { SimpleLogList } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Posted Needs',
  description: 'Talent needs posted by founders through Concierge.',
  path: '/forge/posted-needs',
  noIndex: true,
})

/**
 * NOTE: No frame exists. Uses the shared log-row treatment from the Approval Queue.
 */
export default async function ForgePostedNeedsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/posted-needs')
  const { needs } = await forge.getPostedNeeds()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>Posted Needs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Talent needs posted by founders through Concierge.</Subtle>
      <SimpleLogList items={needs} />
    </AppShell>
  )
}
