'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  Modal,
  SectionLabel,
} from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/FM/Assign Mentors.png
 *            /reference/mast phone ui/FM/Assign Mentors.png
 *            /reference/mast ui/Overlay/FM Assign Mentors Pick Mentor.png
 *
 * Selecting a mentor closes the request, gives its placeholder session a
 * mentor and notifies the student in one transaction.
 */
export default function MentorAssignment({
  requests = [],
  mentors = [],
  sessionLog = [],
  mobileAssignments = [],
}) {
  const router = useRouter()
  const [picking, setPicking] = useState(null)
  const [confirmed, setConfirmed] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  async function selectMentor(mentor) {
    setSubmitting(true)
    try {
      await api.post('/api/forge/mentorship', {
        requestId: picking.requestId,
        mentorId: mentor.mentorId,
      })
      setConfirmed({ request: picking, mentor })
      setPicking(null)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* ---- Desktop: pending requests + session log --------------------- */}
      <div className="hidden lg:block">
        <SectionLabel>Pending Requests ({requests.length})</SectionLabel>
        <ul className="mt-3 space-y-3">
          {requests.map((request) => {
            return (
              <li key={request.id}>
                <Card className="flex items-center gap-4 px-5 py-4">
                  <Avatar
                    initials={request.initials}
                    tone={request.tone}
                    shape="square"
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink">
                      {request.title}
                    </p>
                    <p className="truncate text-[13px] text-muted">{request.detail}</p>
                  </div>
                  <Chip tone={request.kindTone} size="lg">
                    {request.kind}
                  </Chip>
                  <Button size="lg" onClick={() => setPicking(request)}>
                    Assign Mentor
                  </Button>
                  <button
                    type="button"
                    disabled
                    title="No row menu yet"
                    aria-label={`More options for ${request.title}`}
                    className="flex size-6 shrink-0 items-center justify-center rounded-control bg-canvas text-[11px] text-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    ⌄
                  </button>
                </Card>
              </li>
            )
          })}
        </ul>

        <SectionLabel className="mt-6">Session Log</SectionLabel>
        <Card padding="lg" className="mt-3 px-6 py-5">
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
                  <p className="truncate text-[15px] font-bold text-ink">
                    {session.title}
                  </p>
                  <p className="truncate text-[13px] text-muted">{session.meta}</p>
                </div>
                <Chip tone={session.tone} size="lg">
                  {session.status}
                </Chip>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---- Mobile: assignment cards ------------------------------------ */}
      <div className="lg:hidden">
        <ul className="space-y-3">
          {mobileAssignments.map((row) => (
            <li key={row.id}>
              <Card padding="lg" className="text-center">
                <div className="flex items-center justify-center gap-3">
                  <Avatar
                    initials={row.initials}
                    tone={row.tone}
                    shape="square"
                    size="lg"
                  />
                  <div className="text-left">
                    <p className="text-[15px] font-bold text-ink">{row.name}</p>
                    <p className="text-[13px] text-muted">{row.meta}</p>
                  </div>
                </div>
                {row.assigned ? (
                  <Chip tone="success" size="lg" className="mt-3">
                    ✓ Assigned to {row.assignedTo}
                  </Chip>
                ) : (
                  <div className="mt-3 flex flex-wrap justify-center gap-2.5">
                    <Chip tone="warning" size="lg">
                      Unassigned
                    </Chip>
                    <Chip tone="warning" size="lg">
                      + Assign to startup
                    </Chip>
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>

        <Button
          fullWidth
          className="mt-4 h-12"
          disabled={requests.length === 0}
          onClick={() => setPicking(requests[0])}
        >
          Assign Student to Startup
        </Button>
      </div>

      {/* ---- Mentor picker ------------------------------------------------ */}
      <Modal
        open={Boolean(picking)}
        onClose={() => setPicking(null)}
        size="lg"
        showClose
        title="Select a Mentor"
        description="Mentors are grouped by their skill focus"
        className="max-h-[85dvh] overflow-y-auto lg:max-w-[470px]"
      >
        <ul className="mt-6 space-y-3">
          {mentors.map((mentor) => (
            <li key={mentor.id}>
              <Card padding="lg" className="bg-canvas">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={mentor.initials}
                    tone="primary"
                    shape="square"
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-ink">
                      {mentor.name}
                    </p>
                    <p className="text-[13px] text-muted">{mentor.kind}</p>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {mentor.skills.map((skill) => (
                    <Chip key={skill} tone="skill" size="lg">
                      {skill}
                    </Chip>
                  ))}
                </div>
                <Button
                  fullWidth
                  className="mt-3 h-10"
                  disabled={submitting}
                  onClick={() => selectMentor(mentor)}
                >
                  Select {mentor.short}
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirmed)}
        onClose={() => setConfirmed(null)}
        title="Mentor Assigned!"
        description={
          confirmed
            ? `${confirmed.mentor.name} has been assigned to ${confirmed.request.title}. Both parties have been notified.`
            : ''
        }
      />
    </>
  )
}
