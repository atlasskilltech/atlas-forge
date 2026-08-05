import { AppShell } from '@/components/layout'
import { HelpTopics } from '@/components/shared'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Help',
  description: 'Guidance on administering ATLAS Forge.',
  path: '/backend/help',
  noIndex: true,
})

/** See HelpTopics — no Help screen exists in the reference set. */
const TOPICS = [
  {
    title: 'Granting and revoking Founder access',
    detail:
      'Search by App ID, then grant or revoke. Revoking reverts the account to Standard Student.',
    href: '/backend/role-assignments',
  },
  {
    title: 'Overriding approval decisions',
    detail:
      "Backend Manager decisions override the Forge Manager's on any job or collab listing.",
    href: '/backend/job-queue',
  },
  {
    title: 'Platform settings',
    detail:
      'Self-registration, auto-approval and moderation switches affect every user immediately.',
    href: '/backend/settings',
  },
  {
    title: 'Reading the audit trail',
    detail:
      'Platform Logs are immutable and record every action with its actor, module and status.',
    href: '/backend/logs',
  },
]

export default function BackendHelpPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER} mobileTitle="Help" backHref="/backend/dashboard">
      <PageTitle className="mb-4">Help</PageTitle>
      <Subtle className="mt-3 mb-[22px] text-sm">
        Common questions about administering ATLAS Forge.
      </Subtle>
      <HelpTopics topics={TOPICS} />
    </AppShell>
  )
}
