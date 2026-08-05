import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Log',
  description: 'Every contact made by founders through Concierge.',
  path: '/backend/contact-log',
  noIndex: true,
})

/**
 * NOTE: No BM frame exists. Reuses the Forge Manager Contact Log screen.
 */
export default function BackendContactLogPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>Contact Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Every contact made by founders through Concierge.</Subtle>
      <AllContactsView />
    </AppShell>
  )
}
