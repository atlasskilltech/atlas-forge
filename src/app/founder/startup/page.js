import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { StartupPage } from '@/components/founder'
import { Button, PageTitle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Startup Page',
  description: 'How your startup appears to students, mentors and the Forge Manager.',
  path: '/founder/startup',
  noIndex: true,
})

export default async function FounderStartupPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/startup')
  const { startup } = await founder.getStartup(user)

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      <div className="mb-4 flex items-start justify-between gap-4 lg:mb-[22px]">
        <PageTitle>
          <span className="lg:hidden">My Startup</span>
          <span className="hidden lg:inline">My Startup Page</span>
        </PageTitle>
        <div className="hidden shrink-0 gap-2.5 lg:flex">
          <Button as={Link} href="/founder/edit-listing" variant="secondary" size="lg">
            Edit Listing
          </Button>
          <Button variant="secondary" size="lg" disabled title="No detail screen exists yet">
            Preview Public View
          </Button>
        </div>
      </div>
      <StartupPage startup={startup} />
    </AppShell>
  )
}
