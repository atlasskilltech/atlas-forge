import { notFound } from 'next/navigation'
import { AppShell } from '@/components/layout'
import { ComplianceDocuments } from '@/components/founder'
import { Button, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { NotFoundError } from '@/lib/errors'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Startup documents',
  description: 'Compliance documents for one startup.',
  noIndex: true,
})

/**
 * One startup's checklist, read-only for staff.
 *
 * The founder's own component renders it with `canManage={false}`, so the two
 * views cannot drift apart: staff see the same rows, the same CORE/RECOMMENDED
 * labels and the same empty states, minus every control that writes.
 */
export default async function ForgeStartupCompliancePage({ params }) {
  const { chromeUser } = await forge.requireForgePage('/forge/compliance')
  const { slug } = await params

  let compliance
  try {
    compliance = await forge.getStartupCompliance(slug)
  } catch (error) {
    if (error instanceof NotFoundError) notFound()
    throw error
  }

  const { startup, rows, stats } = compliance

  return (
    <AppShell
      role={ROLES.FORGE_MANAGER}
      user={chromeUser}
      mobileTitle="Documents"
      backHref="/forge/compliance"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <PageTitle>{startup.name}</PageTitle>
          <Subtle className="mt-3 text-sm">
            Compliance documents, read-only. Uploads stay with the startup.
          </Subtle>
        </div>
        {stats.uploaded > 0 ? (
          <Button
            as="a"
            href={`/api/documents/download-all?startup=${encodeURIComponent(startup.slug)}`}
            size="lg"
            download
          >
            Download all
          </Button>
        ) : null}
      </div>

      <div className="mt-4 lg:mt-[22px]">
        <ComplianceDocuments rows={rows} stats={stats} canManage={false} />
      </div>
    </AppShell>
  )
}
