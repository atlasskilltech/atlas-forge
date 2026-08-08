import { Card, Chip, SectionLabel, StatCard, Subtle } from '@/components/ui'
import { cn } from '@/lib/utils'

const DOT = {
  primary: 'bg-primary-500',
  success: 'bg-success-fill',
  warning: 'bg-warning-fill',
  neutral: 'bg-muted-fill',
}

/**
 * Reference: /reference/mast ui/SA/Activity Report.png
 *            /reference/mast phone ui/SA/Activity Report.png
 *
 * Note: the reference centres each event row's text. Rows are left-aligned here,
 * matching the equivalent activity lists on the Student, Founder and Forge
 * Manager frames — see the section notes.
 */
export default function ActivityReport({
  stats: reportStats = [],
  events: platformEvents = [],
  mobileEvents = [],
  range: reportRange = '',
}) {
  return (
    <>
      {/* ---- Desktop ----------------------------------------------------- */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap gap-3">
          {reportStats.map((stat) => (
            <StatCard key={stat.label} {...stat} className="min-w-[148px]" />
          ))}
        </div>

        <SectionLabel className="mt-5">Recent Platform Events — View Only</SectionLabel>
        <Card padding="lg" className="mt-3 px-6 py-5">
          <ul>
            {platformEvents.map((event, index) => (
              <li
                key={event.id}
                className={
                  index < platformEvents.length - 1
                    ? 'flex items-center gap-3.5 border-b border-line py-4 first:pt-0'
                    : 'flex items-center gap-3.5 pt-4'
                }
              >
                <span
                  aria-hidden="true"
                  className={cn('size-2 shrink-0 rounded-full', DOT[event.dot])}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-ink">{event.title}</p>
                  <p className="truncate text-[13px] text-muted">{event.meta}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---- Mobile ------------------------------------------------------ */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <Subtle>Last 30 days</Subtle>
          <Chip tone="info" size="lg">
            {reportRange}
          </Chip>
        </div>

        <ul className="mt-3 space-y-3">
          {mobileEvents.map((event) => (
            <li key={event.id}>
              <Card padding="lg">
                <p className="text-[15px] font-bold text-ink">{event.title}</p>
                <p className="mt-1 text-[13px] text-muted">{event.meta}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
