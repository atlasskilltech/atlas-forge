import { AppShell } from '@/components/layout'
import { OutsiderApplications } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import * as outsider from '@/lib/modules/forge/outsider'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Public Incubation Applications',
  description: 'Review incubation applications submitted from the public website.',
  path: '/forge/outsider-applications',
  noIndex: true,
})

export default async function ForgeOutsiderApplicationsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/outsider-applications')
  const { applications, counts, filters } = await outsider.getOutsiderApplications()

  return (
    <AppShell
      role={ROLES.FORGE_MANAGER}
      user={chromeUser}
      mobileTitle="Public Applications"
      backHref="/forge/more"
    >
      <PageTitle>Public Incubation Applications</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Submitted from the ATLAS Forge website by applicants without an account. Approve to
        create their Founder account and startup; reject to close the application.
      </Subtle>
      <OutsiderApplications applications={applications} counts={counts} filters={filters} />
    </AppShell>
  )
}
