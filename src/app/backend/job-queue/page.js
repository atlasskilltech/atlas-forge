import { AppShell } from '@/components/layout'
import { JobQueueTable } from '@/components/backend'
import { Chip } from '@/components/ui'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as backend from '@/lib/modules/backend'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Job Approval Queue',
  description: 'Approve or reject any listing. Actions override Forge Manager decisions.',
  path: '/backend/job-queue',
  noIndex: true,
})

export default async function BackendJobQueuePage() {
  const { user, chromeUser } = await backend.requireBackendPage('/backend/job-queue')
  const { rows, tabs, pending } = await backend.getJobQueue()

  return (
    <AppShell role={ROLES.BACKEND_MANAGER} user={chromeUser}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>Job Approval Queue</PageTitle>
        <Chip tone="warning" size="lg" className="hidden h-[26px] lg:inline-flex">
          {pending} pending
        </Chip>
      </div>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Full override access. Approve or reject any listing. Actions override Forge
        Manager decisions.
      </Subtle>
      <JobQueueTable rows={rows} tabs={tabs} />
    </AppShell>
  )
}
