import { AppShell } from '@/components/layout'
import { SimpleLogList } from '@/components/forge'
import { postedNeeds } from '@/data/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
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
export default function ForgePostedNeedsPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>Posted Needs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Talent needs posted by founders through Concierge.</Subtle>
      <SimpleLogList items={postedNeeds} />
    </AppShell>
  )
}
