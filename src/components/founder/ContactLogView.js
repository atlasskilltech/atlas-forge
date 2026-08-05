import { Avatar, Card, Chip, DataTable } from '@/components/ui'
import { contactLog } from '@/data/founder'

/**
 * Reference: /reference/mast ui/Founder/Contact Log.png       (6-column table)
 *            /reference/mast phone ui/Founder/Contact Log.png (avatar cards)
 */

const COLUMNS = [
  { key: 'student', label: 'Student' },
  { key: 'appId', label: 'App ID' },
  { key: 'context', label: 'Context' },
  { key: 'when', label: 'Date & Time' },
  { key: 'ccd', label: "CC'd" },
  { key: 'status', label: 'Status' },
]

export default function ContactLogView() {
  const rows = contactLog.map((entry) => ({
    id: entry.id,
    student: entry.student,
    appId: entry.appId,
    context: entry.context,
    when: entry.when,
    ccd: <span className="text-primary-500">{entry.ccd}</span>,
    status: <Chip tone={entry.tone}>{entry.status}</Chip>,
  }))

  return (
    <>
      <div className="hidden lg:block">
        <DataTable
          columns={COLUMNS}
          rows={rows}
          caption="Students contacted through Concierge"
        />
      </div>

      <ul className="space-y-3 lg:hidden">
        {contactLog.map((entry) => (
          <li key={entry.id}>
            <Card padding="lg">
              <div className="flex items-center gap-3">
                <Avatar
                  initials={entry.initials}
                  tone={entry.avatarTone}
                  shape="square"
                  size="md"
                />
                <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                  {entry.student}
                </p>
                <Chip tone={entry.tone}>{entry.status}</Chip>
              </div>
              <p className="mt-3 text-[13px] text-muted">{entry.mobileMeta}</p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
