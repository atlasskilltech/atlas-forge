import { AppShell } from '@/components/layout'
import { StartupListingForm } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Apply for Incubation',
  description: 'Complete your startup profile to unlock the Founder dashboard.',
  path: '/founder/incubation',
  noIndex: true,
})

/**
 * Reference: /reference/mast ui/Founder/Startup Profile Setup.png — the same
 * field set as Edit Listing, with the setup heading and confirmation.
 */
export default async function FounderIncubationPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/incubation')
  const form = await founder.getStartupForm(user)

  return (
    <AppShell
      role={ROLES.FOUNDER}
      user={chromeUser}
      mobileTitle="Apply for Incubation"
      backHref="/founder/home"
    >
      <PageTitle>
        <span className="lg:hidden">Apply for Incubation</span>
        <span className="hidden lg:inline">Complete Your Startup Profile</span>
      </PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        <span className="lg:hidden">
          Submit your startup for ATLAS Forge. Reviewed by Mihir Pawar.
        </span>
        <span className="hidden lg:inline">
          Add your startup details to unlock your Founder dashboard. You can edit these
          any time.
        </span>
      </Subtle>
      <StartupListingForm mode="setup" {...form} />
    </AppShell>
  )
}
