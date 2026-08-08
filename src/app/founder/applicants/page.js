import { AppShell } from '@/components/layout'
import { Avatar, Button, Card, Chip, PageTitle, SectionLabel, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Applicants',
  description: 'Students who have applied to your open roles.',
  path: '/founder/applicants',
  noIndex: true,
})

/**
 * There is no standalone Applicants frame; the reference draws applicants as a
 * panel inside /reference/mast ui/Founder/Hiring.png. This page reuses that exact
 * row treatment, grouped per listing — no new visual language is introduced.
 */
export default async function FounderApplicantsPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/applicants')
  const { listings } = await founder.getApplicants(user)

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      <PageTitle>Applicants</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Students who have applied to your open roles. Mihir Pawar is CC&apos;d on every
        contract.
      </Subtle>

      <div className="space-y-4">
        {listings.map((listing) => (
          <Card key={listing.id} padding="lg" className="lg:px-6 lg:py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-bold text-ink">{listing.title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{listing.detailMeta}</p>
              </div>
              <Chip tone={listing.tone}>{listing.status}</Chip>
            </div>

            <SectionLabel className="mt-4">
              Applicants ({listing.applicants.length})
            </SectionLabel>
            <ul className="mt-2.5 space-y-2">
              {listing.applicants.map((applicant) => (
                <li
                  key={`${listing.id}-${applicant.id}`}
                  className="flex items-center gap-3.5 rounded-tile border border-line-soft px-3.5 py-3"
                >
                  <Avatar
                    initials={applicant.initials}
                    tone={applicant.tone}
                    shape="square"
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {applicant.name}
                    </p>
                    <p className="text-[13px] text-muted">{applicant.meta}</p>
                  </div>
                  <Button
                    variant="subtle"
                    size="md"
                    disabled
                    title="No detail screen exists yet"
                    className="shrink-0 border-0 bg-primary-100 text-primary-text"
                  >
                    View Profile
                  </Button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </AppShell>
  )
}
