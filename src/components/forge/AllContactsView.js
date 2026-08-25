import { Button, Card, Chip, DataTable, StatCard } from '@/components/ui'

/**
 * Reference: /reference/mast ui/FM/Contact Log.png       (4 stats + 7-column table)
 *            /reference/mast phone ui/FM/Contact Log.png (cards)
 *
 * Shared by Contact Log and Contract Log — the same columns describe outreach
 * and the engagements that came out of it, so each route supplies its own rows.
 */

const COLUMNS = [
  { key: 'founder', label: 'Founder' },
  { key: 'student', label: 'Student' },
  { key: 'context', label: 'Context' },
  { key: 'date', label: 'Date' },
  { key: 'ccd', label: "CC'd" },
  { key: 'status', label: 'Status' },
  { key: 'action', label: 'Action' },
]

export default function AllContactsView({ contacts = [], stats = [], caption }) {
  const rows = contacts.map((entry) => ({
    id: entry.id,
    founder: entry.founder,
    student: <span className="text-primary-text">{entry.student}</span>,
    context: entry.context,
    date: entry.date,
    ccd: <span className="text-primary-text">{entry.ccd}</span>,
    status: <Chip tone={entry.tone}>{entry.status}</Chip>,
    action: (
      <Button
        variant="subtle"
        size="sm"
        disabled
        title="No detail screen exists yet"
        className="border-0 bg-primary-100 text-primary-text"
      >
        View
      </Button>
    ),
  }))

  return (
    <>
      <div className="flex flex-wrap gap-2.5 lg:gap-3">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} className="min-w-[110px] lg:min-w-[120px]" />
        ))}
      </div>

      <div className="mt-4 hidden lg:mt-[18px] lg:block">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          caption={caption ?? 'Every contact made by founders through Service'}
        />
      </div>

      <ul className="mt-4 space-y-3 lg:hidden">
        {contacts.map((entry) => (
          <li key={entry.id}>
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-bold text-ink">
                  {entry.founder} → {entry.student}
                </p>
                <Chip tone={entry.tone}>{entry.status}</Chip>
              </div>
              <p className="mt-2.5 text-[13px] text-muted">
                {entry.context} · {entry.date}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
