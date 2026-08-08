import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { HiringPanel } from '@/components/founder'
import { Button, PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Hiring',
  description: 'Manage your job listings and review applicants.',
  path: '/founder/hiring',
  noIndex: true,
})

export default async function FounderHiringPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/hiring')
  const { tabs, listingsByTab, applicantsByListing } = await founder.getHiring(user)

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      <div className="mb-4 flex items-start justify-between gap-4 lg:mb-[22px]">
        <PageTitle>
          <span className="lg:hidden">My Listings</span>
          <span className="hidden lg:inline">Hiring</span>
        </PageTitle>
        <Button
          as={Link}
          href="/founder/post-job"
          size="lg"
          className="hidden shrink-0 lg:inline-flex"
        >
          + Post a Job
        </Button>
      </div>
      <HiringPanel
        tabs={tabs}
        listingsByTab={listingsByTab}
        applicantsByListing={applicantsByListing}
      />
    </AppShell>
  )
}
