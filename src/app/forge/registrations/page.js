import { AppShell } from '@/components/layout'
import { RegistrationApplications } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import * as registrations from '@/lib/modules/forge/registrations'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Registrations',
  description: 'Review registrations submitted from the public ATLAS Forge network page.',
  path: '/forge/registrations',
  noIndex: true,
})

export default async function ForgeRegistrationsPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/registrations')
  const { registrations: rows, counts, filters } = await registrations.getRegistrations()

  return (
    <AppShell
      role={ROLES.FORGE_MANAGER}
      user={chromeUser}
      mobileTitle="Registrations"
      backHref="/forge/more"
    >
      <PageTitle>Network Registrations</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Submitted from the public &ldquo;Join the ATLAS Forge Network&rdquo; page by people without
        an account. Review the details, then approve or reject. Approved registrants do not get
        access until their account is created in a following step.
      </Subtle>
      <RegistrationApplications registrations={rows} counts={counts} filters={filters} />
    </AppShell>
  )
}
