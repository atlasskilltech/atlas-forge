import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { ComplianceDocuments } from '@/components/founder'
import { Button, Card, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Compliance & Documents',
  description: 'Keep startup documents organised, current, and ready for approved collaborators.',
  path: '/founder/compliance',
  noIndex: true,
})

export default async function FounderCompliancePage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/compliance')
  const { startup, rows, stats } = await founder.getCompliance(user)

  return (
    <AppShell
      role={ROLES.FOUNDER}
      user={chromeUser}
      mobileTitle="Compliance & Docs"
      backHref="/founder/startup"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <PageTitle>Compliance &amp; Documents</PageTitle>
          <Subtle className="mt-3 text-sm">
            Keep startup documents organised, current, and ready for approved collaborators.
          </Subtle>
        </div>
        {startup && stats?.uploaded > 0 ? (
          <Button as="a" href="/api/documents/download-all" size="lg" download>
            Download all
          </Button>
        ) : null}
      </div>

      <div className="mt-4 lg:mt-[22px]">
        {startup ? (
          <ComplianceDocuments rows={rows} stats={stats} canManage />
        ) : (
          // A founder with no startup has nothing to file documents against.
          // Sending them to the form is more use than fourteen upload buttons
          // that would all fail.
          <Card padding="lg">
            <p className="text-[15px] font-bold text-ink">No startup profile yet</p>
            <p className="mt-2 text-[13px] text-muted">
              Compliance documents are filed against your startup. Create your startup
              profile first, then upload your paperwork here.
            </p>
            <Button as={Link} href="/founder/edit-listing" size="lg" className="mt-4">
              Create startup profile
            </Button>
          </Card>
        )}
      </div>
    </AppShell>
  )
}
