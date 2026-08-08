import { Button, Card, Chip, DataTable } from '@/components/ui'

/**
 * Reference: /reference/mast ui/BM/Platform Logs.png       (5-column audit trail)
 *            /reference/mast phone ui/BM/Platform Logs.png (cards)
 *
 * Shared by Platform Logs, Activity Log and Error Logs. Error rows come from
 * `error_logs` rather than from activity filtered by module — the mock stood
 * in for a table that had not been built yet.
 */
const COLUMNS = [
  { key: 'time', label: 'Timestamp' },
  { key: 'actor', label: 'Actor' },
  { key: 'action', label: 'Action' },
  { key: 'module', label: 'Module' },
  { key: 'status', label: 'Status' },
  { key: 'more', label: '' },
]

export default function PlatformLogsTable({ rows: entries = [], caption }) {
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
        disabled
        title="No expanded view yet"
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
        <DataTable columns={COLUMNS} rows={rows} caption={caption ?? 'Platform audit trail'} />
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
