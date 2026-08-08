import { AppShell } from '@/components/layout'
import { IncubationApplications } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Incubation Applications',
  description: 'Review incubation submissions and grant Founder access.',
  path: '/forge/applications',
  noIndex: true,
})

export default async function ForgeApplicationsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/applications')
  const { applications } = await forge.getIncubation()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <PageTitle>Incubation Applications</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Review submissions offline. Approve to unlock Founder access for the applicant.
      </Subtle>
      <IncubationApplications applications={applications} />
    </AppShell>
  )
}
