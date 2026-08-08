'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  FormField,
  Modal,
  SectionLabel,
  SegmentedControl,
} from '@/components/ui'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Student/Mentorship.png
 *            /reference/mast phone ui/Student/Mentorship.png
 *            /reference/mast ui/Overlay/Request Mentorship Form.png
 *            /reference/mast ui/Overlay/Student Request Mentorship Sent.png
 *
 * `mentorTypes` carries a slug alongside each label; the segmented control
 * shows the label and the request sends the slug, so the mentor type the
 * student picked resolves to the same row the Forge Manager assigns from.
 */
export default function MentorshipPanel({ sessions = [], assignedMentor, mentorTypes = [] }) {
  const router = useRouter()
  const typeNames = mentorTypes.map((type) => type.name)
  const [formOpen, setFormOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [mentorType, setMentorType] = useState(typeNames[0])
  const [, startTransition] = useTransition()

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/student/mentorship', {
        topic: form.get('topic'),
        context: form.get('context'),
        mentorType: mentorTypes.find((type) => type.name === mentorType)?.slug ?? null,
        timing: form.get('timing'),
      })
      setFormOpen(false)
      setSent(true)
      startTransition(() => router.refresh())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button size="xl" className="hidden lg:inline-flex" onClick={() => setFormOpen(true)}>
        + Request a Mentorship Session
      </Button>

      {/* ---- Desktop: session cards -------------------------------------- */}
      <div className="hidden lg:block">
        <SectionLabel className="mt-6">My Sessions</SectionLabel>
        <div className="mt-3 grid gap-[18px] lg:grid-cols-3">
          {sessions.map((session) => (
            <Card key={session.id} padding="lg" className="self-start px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13px] text-muted">{session.when}</p>
                <Chip tone={session.statusTone}>{session.status}</Chip>
              </div>
              <p className="mt-3 text-[15px] font-bold text-ink">{session.mentor}</p>
              <p className="mt-2 text-[13px] text-muted">{session.topic}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ---- Mobile: assigned mentor + request --------------------------- */}
      <div className="lg:hidden">
        {assignedMentor ? (
          <Card padding="lg">
            <div className="flex items-center gap-3.5">
              <Avatar
                initials={assignedMentor.initials}
                tone="warning"
                shape="square"
                size="xl"
                className="bg-warning-fill text-white"
              />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{assignedMentor.name}</p>
                <p className="text-[13px] text-muted">{assignedMentor.role}</p>
              </div>
            </div>
          </Card>
        ) : null}

        <Button fullWidth className="mt-4 h-12" onClick={() => setFormOpen(true)}>
          Request Session
        </Button>
      </div>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        showClose
        title="Request a Mentorship Session"
        description="Mihir Pawar reviews requests and matches you with a mentor."
      >
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <FormField
            label="What do you need help with?"
            name="topic"
            placeholder="e.g. Improving onboarding UX for our patient app"
            required
            requiredMark={false}
          />
          <FormField
            label="Context / background"
            name="context"
            as="textarea"
            rows={3}
            placeholder="Share anything the mentor should know before the session"
          />
          <div className="space-y-2">
            <p className="text-[13px] leading-4 font-semibold text-ink">
              Preferred mentor type
            </p>
            <SegmentedControl
              label="Preferred mentor type"
              tone="primary"
              options={typeNames}
              value={mentorType}
              onChange={setMentorType}
            />
          </div>
          <FormField
            label="Preferred timing"
            name="timing"
            placeholder="e.g. Weekday evenings, or Thu 3–5 PM"
          />
          <Button type="submit" fullWidth className="h-12" disabled={submitting}>
            Send Request
          </Button>
          {/* The reference's footnote slot also carries the failure message, so
              an error never adds an element the design does not have. */}
          <p className={cn('text-xs', error ? 'text-danger' : 'text-muted')} role={error ? 'alert' : undefined}>
            {error ??
              "Mihir Pawar will review your request and confirm a mentor and time. You'll be notified once scheduled."}
          </p>
        </form>
      </Modal>

      <ConfirmDialog
        open={sent}
        onClose={() => setSent(false)}
        title="Request Sent!"
        description="Mihir Pawar will match you with a mentor and confirm a time. You'll see it under My Sessions once scheduled."
      />
    </>
  )
}
