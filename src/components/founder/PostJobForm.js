'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Card, ConfirmDialog, FormField, SegmentedControl } from '@/components/ui'
import { useIsDesktop } from '@/hooks/useMediaQuery'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Founder/Post a Job.png
 *            /reference/mast phone ui/Founder/Post a Job.png (trimmed field set)
 *            /reference/mast ui/Overlay/Founder Post a Job Submitted.png
 */
export default function PostJobForm({ contractTypes = [] }) {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const contractNames = contractTypes.map((type) => type.name)
  const [contract, setContract] = useState(contractNames[0])
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
      await api.post('/api/founder/listings', {
        title: form.get('title'),
        description: form.get('description'),
        // Sent as typed. The server accepts either a slug or a label, so the
        // free-text role-type field resolves the same way the segmented
        // control does.
        roleType: form.get('roleType'),
        contractType: contractTypes.find((type) => type.name === contract)?.slug ?? null,
        compensation: form.get('compensation'),
        skills: form.get('skills'),
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
              options={contractNames}
              value={contract}
              onChange={setContract}
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

          {/* The reference footnote slot doubles as the error slot, so a
              failure never adds an element the design does not have. */}
          <p
            className={cn('text-[13px] lg:block', error ? 'text-danger' : 'hidden text-muted')}
            role={error ? 'alert' : undefined}
          >
            {error ??
              "Once submitted, Mihir Pawar will review and approve before it goes live. You'll be notified once live."}
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
