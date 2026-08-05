import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { Button, Card, PageTitle, SectionLabel, StatCard, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import {
  dashboardStats,
  mobileDashboardStats,
  mobileQuickActions,
  platformActivity,
  quickAccessControls,
} from '@/data/backend'
import { buildMetadata } from '@/lib/seo'
import { cn } from '@/lib/utils'

export const metadata = buildMetadata({
  title: 'Platform Dashboard',
  description: 'Full platform overview and override controls.',
  path: '/backend/dashboard',
  noIndex: true,
})

const DOT = {
  primary: 'bg-primary-500',
  success: 'bg-success-fill',
  danger: 'bg-danger-fill',
  neutral: 'bg-muted-fill',
}

/**
 * Reference: /reference/mast ui/BM/Platform Dashboard.png
 *            /reference/mast phone ui/BM/Platform Dashboard.png
 */
export default function BackendDashboardPage() {
  return (
    <AppShell role={ROLES.BACKEND_MANAGER}>
      <PageTitle>
        <span className="lg:hidden">Dashboard</span>
        <span className="hidden lg:inline">Platform Dashboard</span>
      </PageTitle>
      <Subtle className="mt-4 hidden text-sm lg:block">
        Full override access. All platform operations visible and actionable from here.
      </Subtle>

      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="mt-[22px] flex flex-wrap gap-3">
          {dashboardStats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[118px]" />
          ))}
        </div>

        <SectionLabel className="mt-6">Quick Access Controls</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-3">
          {quickAccessControls.map((action) => (
            <Button
              key={action.label}
              as={Link}
              href={action.href}
              size="xl"
              variant={action.variant}
            >
              {action.label}
            </Button>
          ))}
        </div>

        <SectionLabel className="mt-6">Recent Platform Activity</SectionLabel>
        <Card padding="lg" className="mt-3 px-6 py-5">
          <ul>
            {platformActivity.map((item, index) => (
              <li
                key={item.id}
                className={
                  index < platformActivity.length - 1
                    ? 'flex items-center gap-3.5 border-b border-line py-3.5 first:pt-0'
                    : 'flex items-center gap-3.5 pt-3.5'
                }
              >
                <span
                  aria-hidden="true"
                  className={cn('size-2 shrink-0 rounded-full', DOT[item.dot])}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                  <p className="truncate text-[13px] text-muted">{item.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <div className="mt-4 flex flex-wrap gap-2.5">
          {mobileDashboardStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact />
          ))}
        </div>

        <SectionLabel className="mt-5">Quick Actions</SectionLabel>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {mobileQuickActions.map((action) => (
            <Button
              key={action.label}
              as={Link}
              href={action.href}
              variant={action.primary ? 'primary' : 'secondary'}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
