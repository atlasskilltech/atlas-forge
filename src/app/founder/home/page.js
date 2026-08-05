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
import {
  founderProfile,
  homeDate,
  homeQuickActions,
  homeStats,
  mobileActivity,
  mobileHomeActions,
  mobileHomeStats,
  recentActivity,
} from '@/data/founder'
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
 */
export default function FounderHomePage() {
  return (
    <AppShell role={ROLES.FOUNDER}>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="flex items-start justify-between gap-4">
          <PageTitle>Welcome back, {founderProfile.shortName}</PageTitle>
          <Chip tone="neutral" size="lg" className="h-[26px] bg-surface text-muted">
            {homeDate}
          </Chip>
        </div>

        <div className="mt-[22px] flex flex-wrap gap-3">
          {homeStats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[130px]" />
          ))}
        </div>

        <SectionTitle className="mt-7">Quick Actions</SectionTitle>
        <div className="mt-3.5 flex flex-wrap gap-3">
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

        <SectionTitle className="mt-7">Recent Activity</SectionTitle>
        <div className="mt-3.5">
          <ActivityList title="Recent Activity" items={recentActivity} />
        </div>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <PageTitle>Good morning, {founderProfile.initials} 👋</PageTitle>
        <Subtle className="mt-3">Your startup overview for today.</Subtle>

        <div className="mt-4 flex flex-wrap gap-2.5">
          {mobileHomeStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact />
          ))}
        </div>

        <SectionLabel className="mt-5">Quick Actions</SectionLabel>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          {mobileHomeActions.map((action) => (
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
