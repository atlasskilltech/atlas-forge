import { AppShell } from '@/components/layout'
import { IncubationStatus } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'My Application',
  description: 'The status of your ATLAS Forge incubation application.',
  path: '/founder/application',
  noIndex: true,
})

/**
 * Reference: /reference/mast phone ui/Founder/Incubation Apply.png — the saved
 * draft card with Continue / Preview. There is no desktop frame for this state,
 * so the same card is used at both sizes.
 */
export default async function FounderApplicationPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/application')
  const { draft } = await founder.getIncubation(user)

  return (
    <AppShell
      role={ROLES.FOUNDER}
      user={chromeUser}
      mobileTitle="My Application"
      backHref="/founder/home"
    >
      <PageTitle>My Application</PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        Submit your startup for ATLAS Forge. Reviewed by Mihir Pawar.
      </Subtle>
      <div className="max-w-[560px]">
        <IncubationStatus draft={draft} />
      </div>
    </AppShell>
  )
}
