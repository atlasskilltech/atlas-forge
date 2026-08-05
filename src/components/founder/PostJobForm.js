'use client'

import { useState } from 'react'
import { Button, Card, ConfirmDialog, FormField, SegmentedControl } from '@/components/ui'
import { contractTypes } from '@/data/founder'
import { useIsDesktop } from '@/hooks/useMediaQuery'

/**
 * Reference: /reference/mast ui/Founder/Post a Job.png
 *            /reference/mast phone ui/Founder/Post a Job.png (trimmed field set)
 *            /reference/mast ui/Overlay/Founder Post a Job Submitted.png
 */
export default function PostJobForm() {
  const isDesktop = useIsDesktop()
  const [contract, setContract] = useState(contractTypes[0])
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <Card
        padding="none"
        className="border-0 bg-transparent shadow-none lg:border lg:bg-surface lg:px-8 lg:py-7 lg:shadow-card"
      >
        <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-[22px]">
          <FormField
            label="Job Title"
            name="title"
            placeholder="e.g. UI/UX Designer"
            size="responsive"
            required
            requiredMark={false}
          />
          <FormField
            label="Role Type"
            name="roleType"
            placeholder="Full-time / Part-time / Contract / Internship"
            size="responsive"
            containerClassName="hidden lg:flex"
          />
          {/* One control per field — the placeholder swaps at the breakpoint so
              no hidden `required` input can block submission. */}
          <FormField
            label="Description"
            name="description"
            as="textarea"
            rows={3}
            placeholder={
              isDesktop
                ? 'What will this person work on? What are you looking for?'
                : 'What will this person work on?'
            }
            required
            requiredMark={false}
          />
          <FormField
            label="Skills Required"
            name="skills"
            placeholder={
              isDesktop ? 'e.g. Figma, React, Marketing...' : 'e.g. Figma, React, Marketing'
            }
            size="responsive"
          />
          <FormField
            label="Compensation"
            name="compensation"
            placeholder={
              isDesktop
                ? 'e.g. Paid · ₹15,000/month  or  Equity · 0.5%  or  Unpaid Collab'
                : 'e.g. Paid · ₹15k/month'
            }
            size="responsive"
          />

          <div className="hidden space-y-2 lg:block">
            <p className="text-[13px] leading-4 font-semibold text-ink">Contract Type</p>
            <SegmentedControl
              label="Contract Type"
              options={contractTypes}
              value={contract}
              onChange={setContract}
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
            Once submitted, Mihir Pawar will review and approve before it goes live.
            You&apos;ll be notified once live.
          </p>
        </form>
      </Card>

      <ConfirmDialog
        open={submitted}
        onClose={() => setSubmitted(false)}
        title="Listing Submitted!"
        description="Mihir Pawar will review your listing before it goes live. You'll be notified once it's approved."
      />
    </>
  )
}
