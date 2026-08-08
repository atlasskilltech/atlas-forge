import { AppShell } from '@/components/layout'
import { StartupListingForm } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Edit Listing',
  description: 'Update how your startup appears across ATLAS Forge.',
  path: '/founder/edit-listing',
  noIndex: true,
})

export default async function FounderEditListingPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/edit-listing')
  const form = await founder.getStartupForm(user)

  return (
    <AppShell
      role={ROLES.FOUNDER}
      user={chromeUser}
      mobileTitle="Edit Listing"
      backHref="/founder/startup"
    >
      <PageTitle>Edit Listing</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Update how {form.values.name ?? 'your startup'} appears to students, mentors and the
        Forge Manager.
      </Subtle>
      <StartupListingForm mode="edit" {...form} />
    </AppShell>
  )
}
