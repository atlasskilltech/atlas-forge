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
const ALL_AREAS = 'All areas'

export default function MentorshipPanel({
  mentor,
  sessions = [],
  upcoming,
  mentorTypes = [],
  alumniMentors = [],
  mentorshipAreas = [],
}) {
  const router = useRouter()
  const typeNames = mentorTypes.map((type) => type.name)
  const areaNames = [ALL_AREAS, ...mentorshipAreas.map((item) => item.name)]
  const [area, setArea] = useState(ALL_AREAS)
  /**
   * The mentor a founder asked for by name, or null for an open request. It
   * only pre-fills the form — the Forge Manager still decides who is assigned,
   * so this is a preference rather than a booking.
   */
  const [requestedMentor, setRequestedMentor] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [mentorType, setMentorType] = useState(typeNames[0])
  const [, startTransition] = useTransition()

  // Filtered here rather than on the server: the whole directory is already
  // on the page, so a filter click should not cost a round trip.
  const visibleMentors =
    area === ALL_AREAS
      ? alumniMentors
      : alumniMentors.filter((alumnus) => alumnus.areas.includes(area))

  function openRequest(alumnus = null) {
    setRequestedMentor(alumnus)
    // An alumni mentor was asked for by name, so the type control should not
    // still say "Faculty Mentor" underneath.
    if (alumnus) {
      setMentorType(typeNames.find((name) => name.includes('Alumni')) ?? typeNames[0])
    }
    setFormOpen(true)
  }

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
            onClick={() => openRequest()}
          >
            Request
          </Button>
        </div>
      </Card>
      ) : null}

      <Button fullWidth className="mt-4 h-12 lg:hidden" onClick={() => openRequest()}>
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

      {/* ---- Alumni mentor directory ------------------------------------- */}
      {alumniMentors.length > 0 ? (
        <div>
          <SectionLabel className="mt-6">
            Alumni Mentors · {alumniMentors.length}
          </SectionLabel>
          <p className="mt-1.5 text-[13px] text-muted">
            ATLAS alumni who offered to mentor. Ask for one by name and the Forge Manager
            arranges the introduction.
          </p>

          {mentorshipAreas.length > 0 ? (
            <SegmentedControl
              label="Mentorship area"
              tone="primary"
              options={areaNames}
              value={area}
              onChange={setArea}
              className="mt-3 overflow-x-auto"
            />
          ) : null}

          <div className="mt-3 grid gap-3 lg:mt-[18px] lg:grid-cols-3 lg:gap-[18px]">
            {visibleMentors.map((alumnus) => (
              <Card key={alumnus.id} padding="lg" className="self-start px-5 py-5">
                <div className="flex items-start gap-3.5">
                  <Avatar
                    initials={alumnus.initials}
                    tone={alumnus.tone}
                    shape="square"
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold text-ink">{alumnus.name}</p>
                    <p className="mt-0.5 text-[13px] leading-[18px] text-muted">
                      {alumnus.role}
                    </p>
                    <p className="mt-1 text-[13px] text-primary-text">{alumnus.meta}</p>
                  </div>
                </div>

                {alumnus.areas.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {alumnus.areas.slice(0, 3).map((name) => (
                      <Chip key={name} tone="skill" size="lg">
                        {name}
                      </Chip>
                    ))}
                    {alumnus.areas.length > 3 ? (
                      <Chip tone="info" size="lg">
                        +{alumnus.areas.length - 3}
                      </Chip>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  className="mt-4"
                  onClick={() => openRequest(alumnus)}
                >
                  Request this mentor
                </Button>
              </Card>
            ))}
          </div>

          {visibleMentors.length === 0 ? (
            <Card padding="lg" className="mt-3">
              <p className="text-[13px] text-muted">
                No alumni mentor has listed {area} yet. Send an open request and the Forge
                Manager will find someone.
              </p>
            </Card>
          ) : null}
        </div>
      ) : null}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        size="lg"
        showClose
        title="Request a Mentorship Session"
        description={
          requestedMentor
            ? `Mihir Pawar will pass this to ${requestedMentor.name} and confirm a time.`
            : 'Mihir Pawar reviews requests and matches you with a mentor.'
        }
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
            // Remounted per mentor so the prefill follows whichever card was
            // clicked; without the key React keeps the first value typed.
            key={requestedMentor?.id ?? 'open-request'}
            label="Context / background"
            name="context"
            as="textarea"
            rows={3}
            defaultValue={
              requestedMentor ? `Requested mentor: ${requestedMentor.name}
` : ''
            }
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
