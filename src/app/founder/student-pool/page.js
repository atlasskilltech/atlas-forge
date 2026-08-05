import { AppShell } from '@/components/layout'
import { ConciergePool } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Search Student Pool',
  description: 'Search the ATLAS Forge student pool by skill and availability.',
  path: '/founder/student-pool',
  noIndex: true,
})

/**
 * The sidebar lists "Concierge" and "Search Student Pool" separately; the
 * reference draws one screen for both (desktop "Concierge" / mobile
 * "Student Pool"). This route renders that same screen so either entry works.
 */
export default function FounderStudentPoolPage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <PageTitle>Search Student Pool</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Contact students. Mihir Pawar is CC&apos;d on all outreach.
      </Subtle>
      <ConciergePool />
    </AppShell>
  )
}
