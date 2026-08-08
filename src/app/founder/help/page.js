import { AppShell } from '@/components/layout'
import { HelpTopics } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Help',
  description: 'Guidance on using ATLAS Forge as a founder.',
  path: '/founder/help',
  noIndex: true,
})

/** See HelpTopics — no Help screen exists in the reference set. */
const TOPICS = [
  {
    title: 'Finding talent through Concierge',
    detail:
      'Search the student pool by skill and availability. Mihir Pawar is CC’d on every outreach.',
    href: '/founder/concierge',
  },
  {
    title: 'Posting a job listing',
    detail:
      'Every listing goes to Mihir Pawar for approval before it appears to students.',
    href: '/founder/post-job',
  },
  {
    title: 'Keeping your startup page current',
    detail:
      'Edit your tagline, stage, hiring status and team so students see accurate details.',
    href: '/founder/edit-listing',
  },
  {
    title: 'Requesting mentorship',
    detail:
      'Mihir Pawar is the primary mentor; Faculty, Alumni and Industry mentors cover special needs.',
    href: '/founder/mentorship',
  },
]

export default async function FounderHelpPage() {
  const { chromeUser } = await founder.requireFounderPage('/founder/help')

  return (
    <AppShell
      role={ROLES.FOUNDER}
      user={chromeUser}
      mobileTitle="Help"
      backHref="/founder/home"
    >
      <PageTitle className="mb-4">Help</PageTitle>
      <Subtle className="mt-3 mb-[22px] text-sm">
        Common questions about running your startup on ATLAS Forge.
      </Subtle>
      <HelpTopics topics={TOPICS} />
    </AppShell>
  )
}
