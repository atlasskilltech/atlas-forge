import { AppShell } from '@/components/layout'
import { ContactManagerCta } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Contact Forge Manager',
  description: 'Message Mihir Pawar, the ATLAS Forge Manager.',
  path: '/student/contact-manager',
  noIndex: true,
})

/**
 * The reference draws this as an overlay only
 * (/reference/mast ui/Overlay/Contact Forge Manager.png), so the route is a thin
 * page that hosts the same CTA and dialog rather than an invented screen.
 */
export default async function StudentContactManagerPage() {
  const { chromeUser } = await student.requireStudentPage('/student/contact-manager')

  return (
    <AppShell
      role={ROLES.STUDENT}
      user={chromeUser}
      mobileTitle="Contact Forge Manager"
      backHref="/student/home"
    >
      <PageTitle className="mb-4">Contact Forge Manager</PageTitle>
      <Subtle className="mt-3 mb-[22px] text-sm">
        Mihir Pawar reviews student requests, approvals and mentorship matching.
      </Subtle>
      <ContactManagerCta />
    </AppShell>
  )
}
