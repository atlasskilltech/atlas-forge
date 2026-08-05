import { AppShell } from '@/components/layout'
import { Card, Chip, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { conciergeContactLog } from '@/data/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Posted Needs',
  description: 'Talent needs you have posted through Concierge.',
  path: '/founder/posted-needs',
  noIndex: true,
})

/**
 * NOTE: the reference set contains no "My Posted Needs" frame. This page is
 * assembled purely from existing design-system pieces and the Concierge data —
 * it should be replaced once a design is supplied.
 */
export default function FounderPostedNeedsPage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      <PageTitle>My Posted Needs</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Talent needs you&apos;ve posted through Concierge. Mihir Pawar is CC&apos;d on
        every engagement.
      </Subtle>

      <ul className="space-y-3">
        {conciergeContactLog.map((need) => (
          <li key={need.id}>
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink">{need.title}</p>
                  <p className="mt-1 text-[13px] text-muted">{need.detail}</p>
                  <p className="mt-1 text-xs text-muted">{need.meta}</p>
                </div>
                <Chip tone={need.tone}>{need.status}</Chip>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </AppShell>
  )
}
