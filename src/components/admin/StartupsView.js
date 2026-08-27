import { Avatar, Card, Chip, DataTable, SectionLabel, StatCard } from '@/components/ui'
import ReadOnlyNote from './ReadOnlyNote'

/**
 * Reference: /reference/mast ui/SA/All Startups.png       (4 stats + 8-column table)
 *            /reference/mast phone ui/SA/All Startups.png (avatar cards)
 */
const COLUMNS = [
  { key: 'name', label: 'Startup' },
  { key: 'domain', label: 'Domain' },
  { key: 'stage', label: 'Stage' },
  { key: 'founder', label: 'Founder' },
  { key: 'team', label: 'Team' },
  { key: 'openRoles', label: 'Open Roles' },
  { key: 'status', label: 'Status' },
  { key: 'mentor', label: 'Mentor' },
]

export default function StartupsView({ startups = [], stats: startupStats = [] }) {
  const rows = startups.map((startup) => ({
    id: startup.id,
    name: (
      <span className="flex items-center gap-3.5">
        <Avatar
          initials={startup.initial}
          src={startup.logoUrl}
          tone={startup.tone}
          shape="square"
          size="sm"
        />
        {startup.name}
      </span>
    ),
    domain: <span className="text-primary-text">{startup.domain}</span>,
    stage: startup.stage,
    founder: startup.founder,
    team: startup.team,
    openRoles: (
      <span className={startup.openRoles > 0 ? 'text-primary-text' : undefined}>
        {startup.openRoles}
      </span>
    ),
    status: <Chip tone={startup.statusTone}>{startup.status}</Chip>,
    mentor:
      startup.mentor === 'Unassigned' ? (
        startup.mentor
      ) : (
        <span className="text-primary-text">{startup.mentor}</span>
      ),
  }))

  return (
    <>
      <div className="hidden flex-wrap gap-3 lg:flex">
        {startupStats.map((stat) => (
          <StatCard key={stat.label} {...stat} className="min-w-[118px]" />
        ))}
      </div>

      <div className="hidden lg:block">
        <SectionLabel className="mt-5">Registered Startups — View Only</SectionLabel>
        <div className="mt-3">
          <DataTable
            columns={COLUMNS}
            rows={rows}
            caption="All incubated startups — view only"
          />
        </div>
        <ReadOnlyNote className="mt-5" />
      </div>

      <ul className="space-y-3 lg:hidden">
        {startups.map((startup) => (
          <li key={startup.id}>
            <Card padding="lg" className="flex items-center gap-3.5">
              <Avatar
                initials={startup.initial}
                src={startup.logoUrl}
                tone={startup.tone}
                shape="square"
                size="lg"
              />
              <div className="min-w-0">
                <p className="flex items-center gap-2.5 text-[15px] font-bold text-ink">
                  {startup.name}
                  <Chip tone={startup.statusTone}>{startup.status}</Chip>
                </p>
                <p className="mt-0.5 truncate text-[13px] text-muted">
                  {startup.mobileMeta}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
