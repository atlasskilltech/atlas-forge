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
 * Reference: /reference/mast ui/Founder/Mentorship.png
 *            /reference/mast phone ui/Founder/Mentorship.png
 *            /reference/mast ui/Overlay/Request Mentorship Form.png
 *
 * The request is filed against the founder's startup, so the Forge Manager
 * knows which project it is for when assigning a mentor.
 */
export default function MentorshipPanel({
  mentor,
  sessions = [],
  upcoming,
  mentorTypes = [],
}) {
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
      await api.post('/api/founder/mentorship', {
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
      {mentor ? (
      <Card padding="lg" className="lg:px-7 lg:py-6">
        <div className="flex items-center gap-3.5 lg:gap-5">
          <Avatar
            initials={mentor.initials}
            tone="dark"
            shape="square"
            size="xl"
            className="lg:size-[52px] lg:text-base"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink lg:text-base">{mentor.name}</p>
            <p className="mt-0.5 text-[13px] text-muted lg:hidden">{mentor.mobileRole}</p>
            <p className="mt-1 hidden text-sm text-muted lg:block">{mentor.role}</p>
            <p className="mt-1 hidden text-[13px] text-primary-text lg:block">
              {mentor.note}
            </p>
          </div>
          <Button
            variant="secondary"
            size="md"
            className="shrink-0 lg:hidden"
            onClick={() => setFormOpen(true)}
          >
            Request
          </Button>
        </div>
      </Card>
      ) : null}

      <Button fullWidth className="mt-4 h-12 lg:hidden" onClick={() => setFormOpen(true)}>
        Request Session
      </Button>

      {/* ---- Desktop sessions -------------------------------------------- */}
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
              <p className="mt-2 text-[13px] leading-[18px] text-muted">{session.topic}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* ---- Mobile upcoming --------------------------------------------- */}
      {upcoming ? (
        <div className="lg:hidden">
          <SectionLabel className="mt-5">Upcoming</SectionLabel>
          <Card padding="lg" className="mt-2.5">
            <p className="text-[15px] font-bold text-ink">{upcoming.title}</p>
            <p className="mt-1 text-[13px] text-muted">{upcoming.when}</p>
          </Card>
        </div>
      ) : null}

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
          {error ? (
            <p role="alert" className={cn('text-xs text-danger')}>
              {error}
            </p>
          ) : null}
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
