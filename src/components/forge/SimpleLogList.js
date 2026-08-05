import { Card, Chip } from '@/components/ui'
import { cn } from '@/lib/utils'

const DOT = {
  primary: 'bg-primary-500',
  success: 'bg-success-fill',
  warning: 'bg-warning-fill',
  danger: 'bg-danger-fill',
}

/**
 * Title / meta / status rows — the row treatment already used by the Approval
 * Queue and Session Log panels. Reused by the routes that have no frame of
 * their own (Posted Needs, Platform Logs, Contract Log) so no new visual
 * language is introduced.
 */
export default function SimpleLogList({ items = [], showDot = false }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Card padding="lg" className="lg:px-5 lg:py-4">
            <div className="flex items-start gap-3.5">
              {showDot ? (
                <span
                  aria-hidden="true"
                  className={cn('mt-1.5 size-2 shrink-0 rounded-full', DOT[item.dot])}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-ink">{item.title}</p>
                <p className="mt-1 text-[13px] text-muted">{item.meta}</p>
              </div>
              <Chip tone={item.tone} size="lg">
                {item.status}
              </Chip>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  )
}
