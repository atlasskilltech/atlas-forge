import Link from 'next/link'
import { AppShell } from '@/components/layout'
import { ActivityList } from '@/components/student'
import {
  Avatar,
  Button,
  Card,
  Chip,
  PageTitle,
  SectionLabel,
  SectionTitle,
  StatCard,
  Subtle,
} from '@/components/ui'
import { ROLES } from '@/config/roles'
import * as founder from '@/lib/modules/founder'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Home',
  description: 'Your ATLAS Forge founder dashboard.',
  path: '/founder/home',
  noIndex: true,
})

/**
 * Reference: /reference/mast ui/Founder/Home Feed.png
 *            /reference/mast phone ui/Founder/Home Feed.png
 *
 * Both feeds are the same rows from `activity_logs`: everything that has
 * happened to this startup, whoever did it. Desktop leads with what happened,
 * mobile leads with who did it.
 */
export default async function FounderHomePage() {
  const { user, chromeUser } = await founder.requireFounderPage('/founder/home')
  const {
    profile,
    date,
    stats,
    mobileStats,
    activity,
    mobileActivity,
    quickActions,
    mobileActions,
  } = await founder.getHome(user)

  return (
    <AppShell role={ROLES.FOUNDER} user={chromeUser}>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between gap-4">
          <PageTitle>Welcome back, {profile.shortName}</PageTitle>
          <Chip tone="neutral" size="lg" className="h-[26px] bg-surface text-muted">
            {date}
          </Chip>
        </div>

        <div className="mt-[22px] flex flex-wrap gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[130px]" />
          ))}
        </div>

        <SectionTitle className="mt-7">Quick Actions</SectionTitle>
        <div className="mt-3.5 flex flex-wrap gap-3">
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

        <SectionTitle className="mt-7">Recent Activity</SectionTitle>
        <div className="mt-3.5">
          <ActivityList title="Recent Activity" items={activity} />
        </div>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <PageTitle>Good morning, {profile.initials} 👋</PageTitle>
        <Subtle className="mt-3">Your startup overview for today.</Subtle>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {mobileStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact />
          ))}
        </div>

        <SectionLabel className="mt-5">Quick Actions</SectionLabel>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {mobileActions.map((action) => (
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

        <SectionLabel className="mt-5">Recent Activity</SectionLabel>
        <Card padding="lg" className="mt-2.5">
          <ul className="space-y-3.5">
            {mobileActivity.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <Avatar
                  initials={item.initials}
                  tone={item.tone}
                  shape="square"
                  size="md"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                  <p className="text-[13px] text-muted">{item.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AppShell>
  )
}
