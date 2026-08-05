import { AppShell } from '@/components/layout'
import { HiringPanel } from '@/components/founder'
import { PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Listings',
  description: 'Every job listing you have posted for your startup.',
  path: '/founder/listings',
  noIndex: true,
})

/**
 * "My Listings" is a tab of the Hiring screen on desktop and its own screen on
 * mobile (/reference/mast phone ui/Founder/Hiring.png). Both render the same panel.
 */
export default function FounderListingsPage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <PageTitle className="mb-4 lg:mb-[22px]">My Listings</PageTitle>
      <HiringPanel />
    </AppShell>
  )
}
