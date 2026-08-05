import { Card, Chip } from '@/components/ui'
import { sessionLog } from '@/data/forge'

/**
 * Reference: the "SESSION LOG" panel inside
 * /reference/mast ui/FM/Assign Mentors.png — reused verbatim for the standalone
 * Session Log route, which has no frame of its own.
 */
export default function SessionLogList() {
  return (
    <>
      <Card padding="lg" className="hidden lg:block lg:px-6 lg:py-5">
        <ul>
          {sessionLog.map((session, index) => (
            <li
              key={session.id}
              className={
                index < sessionLog.length - 1
                  ? 'flex items-center gap-4 border-b border-line py-4 first:pt-0'
                  : 'flex items-center gap-4 pt-4'
              }
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{session.title}</p>
                <p className="truncate text-[13px] text-muted">{session.meta}</p>
              </div>
              <Chip tone={session.tone} size="lg">
                {session.status}
              </Chip>
            </li>
          ))}
        </ul>
      </Card>

      <ul className="space-y-3 lg:hidden">
        {sessionLog.map((session) => (
          <li key={session.id}>
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-bold text-ink">{session.title}</p>
                <Chip tone={session.tone}>{session.status}</Chip>
              </div>
              <p className="mt-2.5 text-[13px] text-muted">{session.meta}</p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
