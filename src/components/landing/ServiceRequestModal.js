'use client'

import { useId, useRef, useState } from 'react'
import { ENQUIRY_EMAIL, SERVICE_OPTIONS } from '@/config/landing'
import EnquirySheet from './EnquirySheet'
import {
  Field,
  FormError,
  PrivacyNote,
  Rule,
  SubmitButton,
  useEnquirySubmit,
} from './EnquiryFields'
import EnquirySuccess from './EnquirySuccess'

/**
 * "How can we Help You?" — Reference: /reference/landing-page/services.png
 * and /reference/landing-page/Service required drop down.png.
 *
 * Opened from the pink strip under the hero ("Questions? Lets Talk") and from
 * Atlas Concierge ("Have a Question? Talk to us").
 */
export default function ServiceRequestModal({ open, onClose }) {
  const titleId = useId()
  const formRef = useRef(null)
  const [sent, setSent] = useState(false)
  const { submit, pending, fieldErrors, formError, reset } = useEnquirySubmit(
    '/api/landing/service-requests'
  )

  /** Puts the sheet back to a blank form, so reopening never shows the last send. */
  function close() {
    onClose?.()
    // After the close transition, not during it — resetting while the panel is
    // still on screen would flash the empty form at the visitor.
    setTimeout(() => {
      setSent(false)
      reset()
      formRef.current?.reset()
    }, 200)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)

    const succeeded = await submit({
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      serviceRequired: data.get('serviceRequired'),
      message: data.get('message'),
    })

    if (succeeded) {
      setSent(true)
      formRef.current?.reset()
    }
  }

  return (
    <EnquirySheet open={open} onClose={close} eyebrow="Atlas Forge Services" labelledBy={titleId}>
      {sent ? (
        <EnquirySuccess
          titleId={titleId}
          heading="Request"
          accent="Received"
          message="Thank you — your service request has reached the ATLAS Forge team. We will get back to you at the email address you provided."
          onClose={close}
        />
      ) : (
        <>
          <h2
            id={titleId}
            className="text-[32px] leading-[0.96] font-bold tracking-[-0.02em] text-forge-ink sm:text-[38px] lg:text-[42px]"
          >
            How can we
            <br />
            <span className="text-forge-pink">Help You?</span>
          </h2>

          <p className="mt-3 max-w-[560px] text-[13.5px] leading-[19px] text-[#4b4a63]">
            Select the service you need and share a concise project brief. Your request will be sent
            to <span className="underline underline-offset-2">{ENQUIRY_EMAIL}</span>.
          </p>

          <Rule className="mt-5" />

          <form ref={formRef} onSubmit={handleSubmit} noValidate={false} className="mt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Name"
                name="name"
                autoComplete="name"
                required
                maxLength={120}
                placeholder="Your full name"
                error={fieldErrors.name}
              />
              <Field
                label="Email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={190}
                placeholder="you@company.com"
                error={fieldErrors.email}
              />
            </div>

            {/* Phone and the service picker share a row from `sm` up: two
                half-width controls instead of two stacked rows is the single
                biggest height saving in this sheet. Field order, names and
                behaviour are unchanged, and they stack again below `sm`. */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field
                label="Phone Number"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={32}
                placeholder="+91"
                error={fieldErrors.phone}
              />
              <Field
                label="Service Required"
                as="select"
                name="serviceRequired"
                required
                defaultValue=""
                error={fieldErrors.serviceRequired}
              >
                <option value="" disabled>
                  Other services
                </option>
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Field>
            </div>

            <div className="mt-4">
              <Field
                label="Tell Us More"
                as="textarea"
                name="message"
                maxLength={2000}
                placeholder="Briefly describe your requirement, timeline or startup."
                error={fieldErrors.message}
              />
            </div>

            {formError ? (
              <div className="mt-4">
                <FormError message={formError} />
              </div>
            ) : null}

            <Rule className="mt-6" />

            <div className="mt-4">
              <PrivacyNote />
            </div>

            <div className="mt-4">
              <SubmitButton pending={pending}>Request Service</SubmitButton>
            </div>
          </form>
        </>
      )}
    </EnquirySheet>
  )
}
