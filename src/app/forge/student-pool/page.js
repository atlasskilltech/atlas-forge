import { AppShell } from '@/components/layout'
import { StudentPoolBrowser } from '@/components/forge'
import { Chip, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as forge from '@/lib/modules/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Student Pool',
  description: 'Every student who has flagged availability on ATLAS Forge.',
  path: '/forge/student-pool',
  noIndex: true,
})

export default async function ForgeStudentPoolPage() {
  const { chromeUser } = await forge.requireForgePage('/forge/student-pool')
  const { students, filters, total } = await forge.getStudentPool()

  return (
    <AppShell role={ROLES.FORGE_MANAGER} user={chromeUser}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>Student Pool</PageTitle>
        <Chip tone="info" size="lg" className="hidden h-[26px] lg:inline-flex">
          {total} students registered
        </Chip>
      </div>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Full view of all students who have flagged availability. Manage and assign from
        here.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <StudentPoolBrowser students={students} filters={filters} />
      </div>
    </AppShell>
  )
}
