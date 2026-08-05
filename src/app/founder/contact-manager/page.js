import { AppShell } from '@/components/layout'
import { ContactManagerCta } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Forge Manager',
  description: 'Message Mihir Pawar, the ATLAS Forge Manager.',
  path: '/founder/contact-manager',
  noIndex: true,
})

/**
 * The reference draws this as an overlay only
 * (/reference/mast ui/Overlay/Contact Forge Manager.png), so the route is a thin
 * page hosting the same CTA and dialog rather than an invented screen.
 */
export default function FounderContactManagerPage() {
  return (
    <AppShell
      role={ROLES.FOUNDER}
      mobileTitle="Contact Forge Manager"
      backHref="/founder/home"
    >
      <PageTitle className="mb-4">Contact Forge Manager</PageTitle>
      <Subtle className="mt-3 mb-[22px] text-sm">
        Mihir Pawar reviews listings, incubation applications and mentorship matching.
      </Subtle>
      <ContactManagerCta />
    </AppShell>
  )
}
