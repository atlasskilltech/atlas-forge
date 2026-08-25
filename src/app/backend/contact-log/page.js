import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Log',
  description: 'Every contact made by founders through Service.',
  path: '/backend/contact-log',
  noIndex: true,
})

/**
 * NOTE: No BM frame exists. Reuses the Forge Manager Contact Log screen.
 */
export default async function BackendContactLogPage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/contact-log')
  const { rows, stats } = await backend.getContacts()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <PageTitle>Contact Log</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">Every contact made by founders through Service.</Subtle>
      <AllContactsView contacts={rows} stats={stats} />
    </AppShell>
  )
}
