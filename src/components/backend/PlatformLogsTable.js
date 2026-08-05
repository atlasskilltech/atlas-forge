import { Button, Card, Chip, DataTable } from '@/components/ui'
import { platformLogs } from '@/data/backend'

/**
 * Reference: /reference/mast ui/BM/Platform Logs.png       (5-column audit trail)
 *            /reference/mast phone ui/BM/Platform Logs.png (cards)
 *
 * @param {string[]} [modules]  Restrict to certain modules, for the Error Logs
 *   and Activity Log routes which have no frames of their own.
 */
const COLUMNS = [
  { key: 'time', label: 'Timestamp' },
  { key: 'actor', label: 'Actor' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'status', label: 'Status' },
  { key: 'more', label: '' },
]

export default function PlatformLogsTable({ modules }) {
  const entries = modules
    ? platformLogs.filter((log) => modules.includes(log.module))
    : platformLogs

  const rows = entries.map((log) => ({
    id: log.id,
    time: <span className="font-normal text-muted">{log.time}</span>,
    actor: log.actor,
    action: <span className="text-ink">{log.action}</span>,
    module: <span className="text-primary-text">{log.module}</span>,
    status: <Chip tone={log.tone}>{log.status}</Chip>,
    more: (
      <Button
        variant="subtle"
        size="sm"
        aria-label={`More detail for ${log.action}`}
        className="size-6 border-0 bg-canvas p-0 text-[11px]"
      >
        ⌄
      </Button>
    ),
  }))

  return (
    <>
      <div className="hidden lg:block">
        <DataTable columns={COLUMNS} rows={rows} caption="Platform audit trail" />
      </div>

      <ul className="space-y-3 lg:hidden">
        {entries.map((log) => (
          <li key={log.id}>
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-bold text-ink">{log.action}</p>
                <Chip tone={log.tone}>{log.status}</Chip>
              </div>
              <p className="mt-2.5 text-[13px] text-muted">
                {log.actor} · {log.module} · {log.time}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
