import Link from 'next/link'
import { Avatar, Card, Chip } from '@/components/ui'
import { applications, mobileApplications } from '@/data/student'

/**
 * Reference: /reference/mast ui/Student/My Applications.png       (avatar rows)
 *            /reference/mast phone ui/Student/My Applications.png (stacked cards)
 */
export default function ApplicationList() {
  return (
    <>
      {/* ---- Desktop rows ------------------------------------------------ */}
      <ul className="hidden space-y-3 lg:block">
        {applications.map((application) => (
          <li key={application.id}>
            <Card className="flex items-center gap-4 px-5 py-4">
              <Avatar
                initials={application.initial}
                tone={application.tone}
                variant="soft"
                shape="square"
                size="lg"
                className="text-base"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">
                  {application.role} - {application.company}
                </p>
                <p className="text-[13px] text-muted">{application.meta}</p>
              </div>
              <Chip tone={application.statusTone} size="lg">
                {application.status}
              </Chip>
              <button
                type="button"
                aria-label={`Show details for ${application.role}`}
                className="flex size-6 shrink-0 items-center justify-center rounded-control bg-canvas text-[11px] text-muted"
              >
                ⌄
              </button>
            </Card>
          </li>
        ))}
      </ul>

      {/* ---- Mobile cards ------------------------------------------------ */}
      <ul className="space-y-3 lg:hidden">
        {mobileApplications.map((application) => (
          <li key={application.id}>
            <Card padding="none" className="px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-[15px] font-bold text-ink">
                  {application.role}
                </p>
                <Chip tone={application.statusTone}>{application.status}</Chip>
              </div>
              <hr className="my-3 border-0 border-t border-line" />
              <Link
                href="/student/applications"
                className="flex items-center justify-between gap-3 text-[13px] font-medium text-primary-text"
              >
                View application details
                <span aria-hidden="true" className="text-muted">
                  ›
                </span>
              </Link>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
