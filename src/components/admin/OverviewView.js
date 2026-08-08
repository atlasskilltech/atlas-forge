import { Card, Chip, DataTable, SectionLabel, StatCard } from '@/components/ui'

/**
 * Reference: /reference/mast ui/SA/Platform Overview.png       (5 stats + table)
 *            /reference/mast phone ui/SA/Platform Overview.png (4 compact tiles)
 */
const COLUMNS = [
  { key: 'name', label: 'Startup' },
  { key: 'founder', label: 'Founder' },
  { key: 'stage', label: 'Stage' },
  { key: 'status', label: 'Status' },
  { key: 'openRoles', label: 'Open Roles' },
  { key: 'mentor', label: 'Mentor' },
]

export default function OverviewView({
  stats: overviewStats = [],
  mobileStats: mobileOverviewStats = [],
  startups: overviewStartups = [],
}) {
  const rows = overviewStartups.map((startup) => ({
    id: startup.id,
    name: startup.name,
    founder: startup.founder,
    stage: startup.stage,
    status: (
      <span
        className={startup.tone === 'success' ? 'text-success' : 'text-warning'}
      >
        {startup.status}
      </span>
    ),
    openRoles: startup.openRoles,
    mentor: startup.mentor,
  }))

  return (
    <>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-3">
          {overviewStats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[118px]" />
          ))}
        </div>

        <SectionLabel className="mt-5">Active Startups — View Only</SectionLabel>
        <div className="mt-3">
          <DataTable
            columns={COLUMNS}
            rows={rows}
            caption="Active startups under ATLAS Forge — view only"
          />
        </div>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <div className="flex flex-wrap gap-2.5">
          {mobileOverviewStats.map((stat) => (
            <StatCard key={stat.label} {...stat} compact />
          ))}
        </div>

        <ul className="mt-4 space-y-3">
          {overviewStartups.map((startup) => (
            <li key={startup.id}>
              <Card padding="lg">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[15px] font-bold text-ink">{startup.name}</p>
                  <Chip tone={startup.tone}>{startup.status}</Chip>
                </div>
                <p className="mt-2.5 text-[13px] text-muted">
                  {startup.founder} · {startup.stage} · {startup.openRoles}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
