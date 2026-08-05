import { Card, CardHeader, Chip } from '@/components/ui'
import { cn } from '@/lib/utils'

const DOT = {
  primary: 'bg-primary-500',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/**
 * Reference: /reference/mast ui/Student/Home.png — "RECENT ACTIVITY" panel.
 * Dot, title, timestamp and a status chip per row.
 */
export default function ActivityList({ title = 'Recent Activity', items = [] }) {
  return (
    <Card padding="lg">
      <CardHeader title={title} />
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-tile border border-line-soft px-3.5 py-3"
          >
            <span
              aria-hidden="true"
              className={cn('size-2 shrink-0 rounded-full', DOT[item.dot])}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
              <p className="text-[13px] text-muted">{item.meta}</p>
            </div>
            <Chip tone={item.tone}>{item.status}</Chip>
          </li>
        ))}
      </ul>
    </Card>
  )
}
