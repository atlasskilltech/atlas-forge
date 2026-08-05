'use client'

import { useState } from 'react'
import { Button, Card, ConfirmDialog, FormField, SegmentedControl } from '@/components/ui'
import { engagementTypes } from '@/data/student'
import { useIsDesktop } from '@/hooks/useMediaQuery'

/**
 * Reference: /reference/mast ui/Student/Post a Collab.png
 *            /reference/mast phone ui/Student/Post a Collab.png
 *            /reference/mast ui/Overlay/Student Post a Collab Submitted.png
 *
 * The mobile reference drops the engagement-type control and the draft action;
 * both are desktop-only here, matching the two frames.
 */
export default function PostCollabForm() {
  const isDesktop = useIsDesktop()
  const [engagement, setEngagement] = useState(engagementTypes[0])
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
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
              options={engagementTypes}
              value={engagement}
              onChange={setEngagement}
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" size="xl" fullWidth className="sm:w-auto">
              Submit for Approval
            </Button>
            <Button variant="secondary" size="xl" className="hidden lg:inline-flex">
              Save as Draft
            </Button>
          </div>

          <p className="hidden text-[13px] text-muted lg:block">
            Collab posts are reviewed by Mihir Pawar before going live. Lightweight
            form — no contract required unless both parties agree.
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
