import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { ActivityList } from '@/components/student'
import { Button, PageTitle, SectionLabel, StatCard, Subtle } from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as student from '@/lib/modules/student'
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
 *
 * A Server Component reads through the Student module, which reads through the
 * service layer. No page or component touches the pool: the first paint is
 * rendered on the server from MySQL, and every later write goes through the
 * Route Handlers under /api/student.
 */
export default async function StudentHomePage() {
  const { userId, chromeUser } = await student.requireStudentPage('/student/home')
  const { profile, stats, mobileStats, activity, quickActions, mobileActions } =
    await student.getHome(userId)

  const firstName = profile.name.split(' ')[0]

  return (
    <AppShell role={ROLES.STUDENT} user={chromeUser}>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <PageTitle>Welcome, {firstName} 👋</PageTitle>

        <div className="mt-[22px] flex flex-wrap gap-3">
          {quickActions.map((action) => (
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
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[142px]" />
          ))}
        </div>

        <div className="mt-6">
          <ActivityList items={activity} />
        </div>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <PageTitle>Good morning 👋</PageTitle>
        <Subtle className="mt-3">What would you like to do today?</Subtle>

        <ul className="mt-4 space-y-3">
          {mobileActions.map((action) => (
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
          {mobileStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
