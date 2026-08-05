import { AppShell } from '@/components/layout'
import { ApprovalQueue } from '@/components/forge'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Job Approval Queue',
  description: 'Review and approve or reject job and collab listings.',
  path: '/forge/approval-queue',
  noIndex: true,
})

export default function ForgeApprovalQueuePage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>
        <span className="lg:hidden">Approval Queue</span>
        <span className="hidden lg:inline">Job Approval Queue</span>
      </PageTitle>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Review and approve or reject job and collab listings before they go live.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <ApprovalQueue />
      </div>
    </AppShell>
  )
}
