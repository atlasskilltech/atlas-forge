import { AppShell } from '@/components/layout'
import { StudentPoolBrowser } from '@/components/forge'
import { Chip, PageTitle, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Student Pool',
  description: 'Every student who has flagged availability on ATLAS Forge.',
  path: '/forge/student-pool',
  noIndex: true,
})

export default function ForgeStudentPoolPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <div className="flex items-start justify-between gap-4">
        <PageTitle>Student Pool</PageTitle>
        <Chip tone="info" size="lg" className="hidden h-[26px] lg:inline-flex">
          12 students registered
        </Chip>
      </div>
      <Subtle className="mt-4 mb-4 hidden text-sm lg:block lg:mb-[22px]">
        Full view of all students who have flagged availability. Manage and assign from
        here.
      </Subtle>
      <div className="mt-4 lg:mt-0">
        <StudentPoolBrowser />
      </div>
    </AppShell>
  )
}
