import { AppShell } from '@/components/layout'
import { StartupListingForm } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { myStartup } from '@/data/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Edit Listing',
  description: 'Update how your startup appears across ATLAS Forge.',
  path: '/founder/edit-listing',
  noIndex: true,
})

export default function FounderEditListingPage() {
  return (
    <AppShell role={ROLES.FOUNDER} mobileTitle="Edit Listing" backHref="/founder/startup">
      <PageTitle>Edit Listing</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Update how {myStartup.name} appears to students, mentors and the Forge Manager.
      </Subtle>
      <StartupListingForm mode="edit" />
    </AppShell>
  )
}
