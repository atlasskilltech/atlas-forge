import { AppShell } from '@/components/layout'
import { PostJobForm } from '@/components/founder'
import { PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Post a Job',
  description: 'Post a job listing for your startup on ATLAS Forge.',
  path: '/founder/post-job',
  noIndex: true,
})

export default async function FounderPostJobPage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/post-job')
  const { contractTypes } = await founder.getJobFormOptions(user)

  return (
    <AppShell
      role={ROLES.FOUNDER}
      user={chromeUser}
      mobileTitle="Post a Job"
      backHref="/founder/hiring"
    >
      <PageTitle>
        <span className="lg:hidden">Post a Job</span>
        <span className="hidden lg:inline">Post a Job Listing</span>
      </PageTitle>
      <Subtle className="mt-3 mb-4 text-sm lg:mb-[22px]">
        <span className="lg:hidden">Reviewed by Mihir Pawar before going live.</span>
        <span className="hidden lg:inline">
          All listings go to Mihir Pawar for approval before going live on the platform.
        </span>
      </Subtle>
      <PostJobForm contractTypes={contractTypes} />
    </AppShell>
  )
}
