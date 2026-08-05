import Link from 'next/link'
import { AppShell } from '@/components/layout'
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  Chip,
  PageTitle,
  SectionLabel,
  StatCard,
} from '@/components/ui'
import { ROLES } from '@/config/roles'
import {
  dashboardContacts,
  dashboardQueue,
  dashboardStats,
  mobileDashboardStats,
  mobilePending,
  mobileQuickActions,
} from '@/data/forge'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Dashboard',
  description: 'Forge Manager dashboard — approvals, contacts and incubation.',
  path: '/forge/dashboard',
  noIndex: true,
})

/**
 * Reference: /reference/mast ui/FM/Dashboard.png
 *            /reference/mast phone ui/FM/Dashboard.png
 */
export default function ForgeDashboardPage() {
  return (
    <AppShell role={ROLES.FORGE_MANAGER}>
      <PageTitle>
        <span className="lg:hidden">Dashboard</span>
        <span className="hidden lg:inline">Forge Manager Dashboard</span>
      </PageTitle>

      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="mt-[22px] flex flex-wrap gap-3">
          {dashboardStats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[118px]" />
          ))}
        </div>

        <div className="mt-[22px] grid gap-[22px] lg:grid-cols-2">
          <Card padding="lg" className="px-6 py-5">
            <CardHeader title="Approval Queue" />
            <ul className="mt-3 space-y-2">
              {dashboardQueue.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/forge/approval-queue"
                    className="flex items-center gap-3.5 rounded-tile border border-line-soft px-3.5 py-3 transition-colors hover:border-primary-200"
                  >
                    <Avatar
                      initials={item.initial}
                      tone={item.tone}
                      variant="soft"
                      shape="square"
                      size="sm"
                      className="text-[13px]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-ink">{item.title}</p>
                      <p className="truncate text-[13px] text-muted">{item.meta}</p>
                    </div>
                    <span aria-hidden="true" className="shrink-0 text-muted">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="lg" className="px-6 py-5">
            <CardHeader title="Contact Log — All Founders" />
            <ul className="mt-3">
              {dashboardContacts.map((contact, index) => (
                <li
                  key={contact.id}
                  className={
                    index < dashboardContacts.length - 1
                      ? 'flex items-center gap-4 border-b border-line py-3.5 first:pt-0'
                      : 'flex items-center gap-4 pt-3.5'
                  }
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{contact.title}</p>
                    <p className="truncate text-[13px] text-muted">{contact.meta}</p>
                  </div>
                  <Chip tone={contact.tone}>{contact.status}</Chip>
                </li>
              ))}
            </ul>
          </Card>
        </div>
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

        <SectionLabel className="mt-5">Pending</SectionLabel>
        <ul className="mt-2.5 space-y-3">
          {mobilePending.map((item) => (
            <li key={item.id}>
              <Card padding="lg">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-bold text-ink">{item.title}</p>
                  <Chip tone="warning">{item.status}</Chip>
                </div>
                <p className="mt-2.5 text-[13px] text-muted">{item.meta}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  )
}
