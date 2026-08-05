import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { ActivityList } from '@/components/student'
import { Button, Card, PageTitle, SectionLabel, StatCard, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import {
  homeQuickActions,
  homeStats,
  mobileHomeActions,
  mobileHomeStats,
  recentActivity,
  studentProfile,
} from '@/data/student'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Home',
  description: 'Your ATLAS Forge student dashboard.',
  path: '/student/home',
  noIndex: true,
})

/**
 * Reference: /reference/mast ui/Student/Home.png
 *            /reference/mast phone ui/Student/Home.png
 *
 * The two frames differ in content, not just density: desktop leads with quick
 * actions and a recent-activity panel; mobile leads with three task cards and
 * a compact stat row.
 */
export default function StudentHomePage() {
  const firstName = studentProfile.name.split(' ')[0]

  return (
    <AppShell role={ROLES.STUDENT}>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <PageTitle>Welcome, {firstName} 👋</PageTitle>

        <div className="mt-[22px] flex flex-wrap gap-3">
          {homeQuickActions.map((action) => (
            <Button
              key={action.label}
              as={Link}
              href={action.href}
              size="xl"
              variant={action.primary ? 'primary' : 'secondary'}
            >
              {action.label}
            </Button>
          ))}
        </div>

        <div className="mt-[22px] flex flex-wrap gap-3">
          {homeStats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[142px]" />
          ))}
        </div>

        <div className="mt-6">
          <ActivityList items={recentActivity} />
        </div>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <PageTitle>Good morning 👋</PageTitle>
        <Subtle className="mt-3">What would you like to do today?</Subtle>

        <ul className="mt-4 space-y-3">
          {mobileHomeActions.map((action) => (
            <li key={action.label}>
              <Link
                href={action.href}
                className="flex h-12 items-center gap-2.5 rounded-card border border-line bg-surface px-4 text-[15px] font-semibold text-ink shadow-card transition-shadow hover:shadow-raised"
              >
                <span aria-hidden="true">{action.icon}</span>
                {action.label}
              </Link>
            </li>
          ))}
        </ul>

        <SectionLabel className="mt-5">My Activity</SectionLabel>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {mobileHomeStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
