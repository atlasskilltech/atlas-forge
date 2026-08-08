import { AppShell } from '@/components/layout'
import { ConciergePool } from '@/components/founder'
import { Chip, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Concierge',
  description: 'Search the ATLAS Forge student pool and contact students.',
  path: '/founder/concierge',
  noIndex: true,
})

/**
 * Titled "Concierge" on desktop and "Student Pool" on mobile — both preserved.
 */
export default async function FounderConciergePage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/concierge')
  const { students, filters, contactLog } = await founder.getConcierge(user)

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>
          <span className="lg:hidden">Student Pool</span>
          <span className="hidden lg:inline">Concierge</span>
        </PageTitle>
        <Chip tone="info" size="lg" className="hidden h-[26px] lg:inline-flex">
          Founder View
        </Chip>
      </div>
      <Subtle className="mt-3 mb-4 text-sm lg:hidden">
        Contact students. Mihir Pawar is CC&apos;d on all outreach.
      </Subtle>
      <div className="lg:mt-[22px]">
        <ConciergePool students={students} filters={filters} contactLog={contactLog} />
      </div>
    </AppShell>
  )
}
