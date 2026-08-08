'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Card, ConfirmDialog, FormField, SegmentedControl } from '@/components/ui'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Student/Post a Collab.png
 *            /reference/mast phone ui/Student/Post a Collab.png
 *            /reference/mast ui/Overlay/Student Post a Collab Submitted.png
 *
 * The mobile reference drops the engagement-type control and the draft action;
 * both are desktop-only here, matching the two frames.
 */
export default function PostCollabForm({ engagementTypes = [] }) {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const typeNames = engagementTypes.map((type) => type.name)
  const [engagement, setEngagement] = useState(typeNames[0])
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [, startTransition] = useTransition()

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setSubmitting(true)
    setError(null)
    try {
      await api.post('/api/student/collabs', {
        title: form.get('title'),
        summary: form.get('summary'),
        collaborator: form.get('collaborator'),
        skills: form.get('skills'),
        engagement: engagementTypes.find((type) => type.name === engagement)?.slug ?? null,
      })
      event.target.reset()
      setSubmitted(true)
      startTransition(() => router.refresh())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card padding="none" className="border-0 bg-transparent shadow-none lg:border lg:bg-surface lg:px-8 lg:py-7 lg:shadow-card">
        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-[22px]">
          <FormField
            label="Collab Title"
            name="title"
            placeholder="e.g. Looking for a UI Designer for my food-tech app"
            size="responsive"
            required
            requiredMark={false}
          />
          <FormField
            label={isDesktop ? 'What are you working on?' : 'What are you building?'}
            name="summary"
            as="textarea"
            rows={3}
            placeholder={
              isDesktop ? 'Brief description of your project or idea' : 'Brief description'
            }
            required
            requiredMark={false}
          />
          <FormField
            label="What kind of collaborator do you need?"
            name="collaborator"
            placeholder="e.g. Developer, Designer, Marketer..."
            size="responsive"
            containerClassName="hidden lg:flex"
          />
          {/* One control — label and placeholder swap at the breakpoint. */}
          <FormField
            label={isDesktop ? 'Skills Required' : 'Skills Needed'}
            name="skills"
            placeholder={
              isDesktop ? 'e.g. React, Figma, Content Writing' : 'e.g. React, Design'
            }
            size="responsive"
          />

          <div className="hidden space-y-2 lg:block">
            <p className="text-[13px] leading-4 font-semibold text-ink">Engagement Type</p>
            <SegmentedControl
              label="Engagement Type"
              options={typeNames}
              value={engagement}
              onChange={setEngagement}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="xl" fullWidth className="sm:w-auto" disabled={submitting}>
              Submit for Approval
            </Button>
            <Button variant="secondary" size="xl" disabled title="Listings have no draft state yet" className="hidden lg:inline-flex">
              Save as Draft
            </Button>
          </div>

          {/* Desktop keeps the reference footnote; a failure replaces its text
              rather than introducing an element the design does not have. On
              mobile, where the footnote is not drawn, the message appears only
              when there is one to show. */}
          <p
            className={cn(
              'text-[13px] lg:block',
              error ? 'text-danger' : 'hidden text-muted'
            )}
            role={error ? 'alert' : undefined}
          >
            {error ??
              'Collab posts are reviewed by Mihir Pawar before going live. Lightweight form — no contract required unless both parties agree.'}
          </p>
        </form>
      </Card>

      <ConfirmDialog
        open={submitted}
        onClose={() => setSubmitted(false)}
        title="Collab Post Submitted!"
        description="Mihir Pawar will review your post before it goes live. You'll be notified once it's approved."
      />
    </>
  )
}
