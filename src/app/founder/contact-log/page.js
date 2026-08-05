import { AppShell } from '@/components/layout'
import { ContactLogView } from '@/components/founder'
import { Chip, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { contactLog } from '@/data/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Log',
  description: 'Every student you have contacted through Concierge.',
  path: '/founder/contact-log',
  noIndex: true,
})

export default function FounderContactLogPage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>Contact Log</PageTitle>
        <Chip tone="info" size="lg" className="hidden h-[26px] lg:inline-flex">
          {contactLog.length} contacts this month
        </Chip>
      </div>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        <span className="lg:hidden">All contacts made via Concierge. Mihir is CC&apos;d.</span>
        <span className="hidden lg:inline">
          All contacts you&apos;ve made through Concierge. Mihir Pawar is CC&apos;d on
          every outreach.
        </span>
      </Subtle>
      <ContactLogView />
    </AppShell>
  )
}
