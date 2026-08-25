import { AppShell } from '@/components/layout'
import { AllContactsView } from '@/components/forge'
import { Chip, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Log',
  description: 'Every contact made by founders through Service.',
  path: '/forge/contact-log',
  noIndex: true,
})

export default async function ForgeContactLogPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/contact-log')
  const { rows, stats, total } = await forge.getContacts()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>
          <span className="lg:hidden">Contact Log</span>
          <span className="hidden lg:inline">Contact Log — All Founders</span>
        </PageTitle>
        <Chip tone="info" size="lg" className="hidden h-[26px] lg:inline-flex">
          {total} total contacts
        </Chip>
      </div>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Every contact made by Founders through Service. You are auto CC&apos;d on all
        outreach emails.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <AllContactsView contacts={rows} stats={stats} />
      </div>
    </AppShell>
  )
}
