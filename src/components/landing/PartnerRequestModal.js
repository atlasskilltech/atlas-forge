'use client'

import { useId, useRef, useState } from 'react'
import { ENQUIRY_EMAIL } from '@/config/landing'
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
 * "Partner With ATLAS Forge" —
 * Reference: /reference/landing-page/Partner with us.png
 *
 * Opened from the header nav ("Partner With Us") and from the footer
 * ("Partner with ATLAS Forge").
 */
export default function PartnerRequestModal({ open, onClose }) {
  const titleId = useId()
  const formRef = useRef(null)
  const [sent, setSent] = useState(false)
  const { submit, pending, fieldErrors, formError, reset } = useEnquirySubmit(
    '/api/landing/partner-requests'
  )

  function close() {
    onClose?.()
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
      company: data.get('company'),
      message: data.get('message'),
    })

    if (succeeded) {
      setSent(true)
      formRef.current?.reset()
    }
  }

  return (
    <EnquirySheet
      open={open}
      onClose={close}
      eyebrow="Partner With ATLAS Forge"
      labelledBy={titleId}
    >
      {sent ? (
        <EnquirySuccess
          titleId={titleId}
          heading="Request"
          accent="Sent"
          message="Thank you — your partnership request has reached the ATLAS Forge team. We will get back to you at the email address you provided."
          onClose={close}
        />
      ) : (
        <>
          <h2
            id={titleId}
            className="text-[32px] leading-[0.96] font-bold tracking-[-0.02em] text-forge-ink uppercase sm:text-[38px] lg:text-[42px]"
          >
            Let&rsquo;s Build
            <br />
            <span className="text-forge-pink">Together</span>
          </h2>

          <p className="mt-3 max-w-[620px] text-[13.5px] leading-[19px] text-[#4b4a63]">
            Interested in partnering with ATLAS Forge? Tell us how you&rsquo;d like to collaborate.
            Your request will be sent to {ENQUIRY_EMAIL}
          </p>

          <Rule className="mt-5" />

          <form ref={formRef} onSubmit={handleSubmit} className="mt-5">
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
                label="Company"
                name="company"
                autoComplete="organization"
                required
                maxLength={160}
                placeholder="Your company name"
                error={fieldErrors.company}
              />
            </div>

            <div className="mt-4">
              <Field
                label="Message"
                as="textarea"
                name="message"
                maxLength={2000}
                placeholder="Tell us about your project or how you'd like to collaborate."
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
              <SubmitButton pending={pending}>Send Request</SubmitButton>
            </div>
          </form>
        </>
      )}
    </EnquirySheet>
  )
}
