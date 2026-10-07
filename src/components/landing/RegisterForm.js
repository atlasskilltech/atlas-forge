'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  ANGEL_NETWORKS,
  CONDUCT_SESSION,
  GRADUATION_YEARS,
  INCUBATION_SUPPORT_NEEDS,
  INVEST_SECTORS,
  LOOKING_FOR_INCUBATION,
  MENTORSHIP_AREAS,
  OPEN_TO_INVESTING,
  PREFERRED_AUDIENCE,
  REGISTRATION_ROLES,
  SEEKING_MENTORSHIP,
  SESSION_TYPES,
  TYPE_OF_SUPPORT,
  WILLING_TO_MENTOR,
} from '@/config/registration'
import { Field, FormError, Rule, SubmitButton, useEnquirySubmit } from './EnquiryFields'
import { CheckboxGroup, RadioGroup, SchoolPicker } from './RegisterOptionGroups'

/**
 * The public "Join the ATLAS Forge Network" registration form.
 *
 * Reference: /reference/form/ — the Start frame (common fields + role selector),
 * the four role frames (Student / Alumni / Faculty / Others) and the Submitted
 * frame. Choosing a role reveals that role's sections below the selector; the
 * common values stay (Dev Notes).
 *
 * Drawn in the landing `forge-` palette, reusing the landing controls so it
 * matches the two existing enquiry sheets. A submit POSTs to
 * `/api/landing/registrations`, which creates ONE pending `registration_requests`
 * row — no account, role or access is granted here. A Forge Manager reviews it.
 */

const SECTION_LABEL = 'text-[11px] font-bold uppercase tracking-[0.12em] text-forge-purple'
const GROUP_TITLE = 'text-[15px] font-bold text-forge-purple'
const GRID = 'grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2'

const CONSENT_BOX = cn(
  'mt-0.5 size-[18px] shrink-0 appearance-none rounded-[4px] border border-[#c9c7e0] bg-white',
  'cursor-pointer transition-colors checked:border-forge-purple checked:bg-forge-purple',
  'relative checked:after:absolute checked:after:left-[5px] checked:after:top-[1px]',
  'checked:after:h-[9px] checked:after:w-[5px] checked:after:rotate-45',
  'checked:after:border-b-2 checked:after:border-r-2 checked:after:border-white checked:after:content-[""]',
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge-purple'
)

/** A required field label: the text plus a pink asterisk. */
const req = (text) => (
  <>
    {text} <span className="font-normal text-forge-pink">*</span>
  </>
)

export default function RegisterForm() {
  const [form, setForm] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const { submit, pending, fieldErrors, formError, reset } = useEnquirySubmit(
    '/api/landing/registrations'
  )

  const role = form.roleCategory ?? ''
  const set = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))
  const setValue = (field, value) => setForm((f) => ({ ...f, [field]: value }))
  const val = (field) => form[field] ?? ''
  const arr = (field) => form[field] ?? []

  const onSubmit = async (event) => {
    event.preventDefault()
    const success = await submit({ ...form, consent: form.consent === true })
    if (success) {
      setSubmitted(true)
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const startOver = () => {
    setForm({})
    setSubmitted(false)
    reset()
  }

  if (submitted) return <SuccessPanel onAgain={startOver} />

  return (
    <>
      <h1 className="mt-7 text-[28px] leading-tight font-medium text-[#3f3f4c] lg:text-[32px]">
        Join the ATLAS Forge Network
      </h1>
      <p className="mt-3 max-w-[560px] text-[15px] leading-[22px] text-[#52526a]">
        Please fill out your details to connect with mentorship, incubation, collaboration, and
        other opportunities at ATLAS Forge.
      </p>

      <form className="mt-8" onSubmit={onSubmit} noValidate>
        <Rule className="mb-7" />
        <p className={SECTION_LABEL}>About</p>

        <div className={cn('mt-4', GRID)}>
          <Field
            label="Name"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={val('fullName')}
            onChange={set('fullName')}
            error={fieldErrors.fullName}
            required
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={val('email')}
            onChange={set('email')}
            error={fieldErrors.email}
            required
          />
          <Field
            label="Phone Number"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+91"
            value={val('phone')}
            onChange={set('phone')}
            error={fieldErrors.phone}
          />
        </div>

        <Rule className="my-7" />

        <div className={GRID}>
          <Field
            as="select"
            label={req('Who are you?')}
            name="roleCategory"
            value={role}
            onChange={set('roleCategory')}
            error={fieldErrors.roleCategory}
            required
          >
            <option value="">You are…</option>
            {REGISTRATION_ROLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Field>
        </div>

        {/* ---- Role sections --------------------------------------------- */}
        {role === 'atlas_student' ? (
          <div className="mt-7 space-y-7">
            <SchoolPicker
              value={val('school')}
              onChange={(value) => setValue('school', value)}
              error={fieldErrors.school}
            />
            <CheckboxGroup
              label="Type of support"
              name="typeOfSupport"
              options={TYPE_OF_SUPPORT}
              values={arr('typeOfSupport')}
              onChange={(value) => setValue('typeOfSupport', value)}
              error={fieldErrors.typeOfSupport}
            />
            <Field
              label={req('Portfolio / work link')}
              name="portfolioLink"
              value={val('portfolioLink')}
              onChange={set('portfolioLink')}
              error={fieldErrors.portfolioLink}
              placeholder="Paste your website, portfolio, or relevant client work"
              required
            />
            <Field
              as="textarea"
              label="Message"
              name="message"
              value={val('message')}
              onChange={set('message')}
              error={fieldErrors.message}
              placeholder="what services you willing to offer"
            />
          </div>
        ) : null}

        {role === 'atlas_alumni' ? (
          <div className="mt-7 space-y-7">
            <div className={GRID}>
              <Field
                label="Department"
                name="department"
                value={val('department')}
                onChange={set('department')}
                error={fieldErrors.department}
                placeholder="e.g. Design, Marketing, HR"
              />
              <Field
                as="select"
                label={req('Batch / graduation year')}
                name="graduationYear"
                value={val('graduationYear')}
                onChange={set('graduationYear')}
                error={fieldErrors.graduationYear}
                required
              >
                <option value="">Select graduation year</option>
                {GRADUATION_YEARS.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </Field>
              <Field
                label={req('Course')}
                name="course"
                value={val('course')}
                onChange={set('course')}
                error={fieldErrors.course}
                placeholder="e.g. B Des, B.Tech, MBA"
                required
              />
              <Field
                label={req('Current city')}
                name="currentCity"
                value={val('currentCity')}
                onChange={set('currentCity')}
                error={fieldErrors.currentCity}
                placeholder="Enter your current city"
                required
              />
              <Field
                label={req('Current role & company')}
                name="currentRoleCompany"
                value={val('currentRoleCompany')}
                onChange={set('currentRoleCompany')}
                error={fieldErrors.currentRoleCompany}
                placeholder="e.g. UI/UX Designer, ABC Studio"
                required
              />
              <Field
                label="LinkedIn profile URL"
                name="linkedinUrl"
                value={val('linkedinUrl')}
                onChange={set('linkedinUrl')}
                error={fieldErrors.linkedinUrl}
                placeholder="linkedin.com/in/yourname"
              />
            </div>

            <p className={GROUP_TITLE}>Professional Background</p>
            <div className={GRID}>
              <Field
                label={req('Industry / sector')}
                name="industrySector"
                value={val('industrySector')}
                onChange={set('industrySector')}
                error={fieldErrors.industrySector}
                placeholder="e.g. Technology, Healthcare, Finance"
                required
              />
              <Field
                label="Years of professional experience"
                name="yearsExperience"
                value={val('yearsExperience')}
                onChange={set('yearsExperience')}
                error={fieldErrors.yearsExperience}
                placeholder="e.g. 3 years"
              />
            </div>

            <p className={GROUP_TITLE}>Mentorship</p>
            <RadioGroup
              label="Are you willing to mentor?"
              required
              name="willingToMentor"
              options={WILLING_TO_MENTOR}
              value={val('willingToMentor')}
              onChange={(value) => setValue('willingToMentor', value)}
              error={fieldErrors.willingToMentor}
            />
            <RadioGroup
              label="Are you seeking mentorship?"
              name="seekingMentorship"
              options={SEEKING_MENTORSHIP}
              value={val('seekingMentorship')}
              onChange={(value) => setValue('seekingMentorship', value)}
              error={fieldErrors.seekingMentorship}
            />
            <CheckboxGroup
              label="Areas of mentorship interest"
              name="mentorshipAreas"
              options={MENTORSHIP_AREAS}
              values={arr('mentorshipAreas')}
              onChange={(value) => setValue('mentorshipAreas', value)}
              error={fieldErrors.mentorshipAreas}
            />

            <p className={GROUP_TITLE}>Events, Sessions &amp; Community Contributions</p>
            <RadioGroup
              label="Would you like to conduct a session or event?"
              required
              name="conductSession"
              options={CONDUCT_SESSION}
              value={val('conductSession')}
              onChange={(value) => setValue('conductSession', value)}
              error={fieldErrors.conductSession}
            />
            <CheckboxGroup
              label="What type of session?"
              name="sessionTypes"
              options={SESSION_TYPES}
              values={arr('sessionTypes')}
              onChange={(value) => setValue('sessionTypes', value)}
              error={fieldErrors.sessionTypes}
            />
            <CheckboxGroup
              label="Preferred audience"
              name="preferredAudience"
              options={PREFERRED_AUDIENCE}
              values={arr('preferredAudience')}
              onChange={(value) => setValue('preferredAudience', value)}
              error={fieldErrors.preferredAudience}
            />
            <Field
              as="textarea"
              label="What topic(s) would you like to cover in your session?"
              name="sessionTopics"
              value={val('sessionTopics')}
              onChange={set('sessionTopics')}
              error={fieldErrors.sessionTopics}
              placeholder="Briefly describe the topics you'd like to discuss."
            />
            <RadioGroup
              label="Are you open to investing in startups?"
              required
              name="openToInvesting"
              options={OPEN_TO_INVESTING}
              value={val('openToInvesting')}
              onChange={(value) => setValue('openToInvesting', value)}
              error={fieldErrors.openToInvesting}
            />
            <RadioGroup
              label="Are you looking for incubation support?"
              required
              name="lookingForIncubation"
              options={LOOKING_FOR_INCUBATION}
              value={val('lookingForIncubation')}
              onChange={(value) => setValue('lookingForIncubation', value)}
              error={fieldErrors.lookingForIncubation}
            />
            <CheckboxGroup
              label="What support do you need?"
              name="incubationSupportNeeds"
              options={INCUBATION_SUPPORT_NEEDS}
              values={arr('incubationSupportNeeds')}
              onChange={(value) => setValue('incubationSupportNeeds', value)}
              error={fieldErrors.incubationSupportNeeds}
            />

            <p className={GROUP_TITLE}>General</p>
            <p className="text-[13px] leading-[19px] text-[#52526a]">
              Atlas Forge Alumni Angel Network — Angel investment starts from small cheques of ₹5
              lakhs and goes up to your wish. This is a way to support fellow alumni founders and the
              next generation of entrepreneurs from our community.
            </p>
            <CheckboxGroup
              label="Preferred sectors to invest in"
              name="investSectors"
              options={INVEST_SECTORS}
              values={arr('investSectors')}
              onChange={(value) => setValue('investSectors', value)}
              error={fieldErrors.investSectors}
            />
            <RadioGroup
              label="Are you part of any angel network?"
              name="angelNetwork"
              options={ANGEL_NETWORKS}
              value={val('angelNetwork')}
              onChange={(value) => setValue('angelNetwork', value)}
              error={fieldErrors.angelNetwork}
            />
            <Field
              as="textarea"
              label="Additional comments or questions"
              name="additionalComments"
              value={val('additionalComments')}
              onChange={set('additionalComments')}
              error={fieldErrors.additionalComments}
              placeholder="Share any additional information or questions you may have."
            />
          </div>
        ) : null}

        {role === 'atlas_faculty' ? (
          <div className="mt-7 space-y-7">
            <div className={GRID}>
              <Field
                label={req('Department')}
                name="department"
                value={val('department')}
                onChange={set('department')}
                error={fieldErrors.department}
                placeholder="e.g. Design, Marketing, HR"
                required
              />
              <Field
                label={req('Designation')}
                name="designation"
                value={val('designation')}
                onChange={set('designation')}
                error={fieldErrors.designation}
                placeholder="e.g. Professor, Program Lead"
                required
              />
              <Field
                label="LinkedIn profile URL"
                name="linkedinUrl"
                value={val('linkedinUrl')}
                onChange={set('linkedinUrl')}
                error={fieldErrors.linkedinUrl}
                placeholder="linkedin.com/in/yourname"
              />
            </div>

            <p className={GROUP_TITLE}>Mentorship</p>
            <RadioGroup
              label="Are you willing to mentor?"
              required
              name="willingToMentor"
              options={WILLING_TO_MENTOR}
              value={val('willingToMentor')}
              onChange={(value) => setValue('willingToMentor', value)}
              error={fieldErrors.willingToMentor}
            />
            <CheckboxGroup
              label="Areas of mentorship interest"
              name="mentorshipAreas"
              options={MENTORSHIP_AREAS}
              values={arr('mentorshipAreas')}
              onChange={(value) => setValue('mentorshipAreas', value)}
              error={fieldErrors.mentorshipAreas}
            />

            <p className={GROUP_TITLE}>Events, Sessions &amp; Community Contributions</p>
            <RadioGroup
              label="Would you like to conduct a session or event?"
              required
              name="conductSession"
              options={CONDUCT_SESSION}
              value={val('conductSession')}
              onChange={(value) => setValue('conductSession', value)}
              error={fieldErrors.conductSession}
            />
            <CheckboxGroup
              label="What type of session?"
              name="sessionTypes"
              options={SESSION_TYPES}
              values={arr('sessionTypes')}
              onChange={(value) => setValue('sessionTypes', value)}
              error={fieldErrors.sessionTypes}
            />
            <CheckboxGroup
              label="Preferred audience"
              name="preferredAudience"
              options={PREFERRED_AUDIENCE}
              values={arr('preferredAudience')}
              onChange={(value) => setValue('preferredAudience', value)}
              error={fieldErrors.preferredAudience}
            />
            <Field
              as="textarea"
              label="What topic(s) would you like to cover in your session?"
              name="sessionTopics"
              value={val('sessionTopics')}
              onChange={set('sessionTopics')}
              error={fieldErrors.sessionTopics}
              placeholder="Briefly describe the topics you'd like to discuss."
            />
          </div>
        ) : null}

        {role === 'others' ? (
          <div className="mt-7 space-y-7">
            <div className={GRID}>
              <Field
                label={req('Organisation')}
                name="organisation"
                value={val('organisation')}
                onChange={set('organisation')}
                error={fieldErrors.organisation}
                placeholder="e.g. Company / Institution name"
                required
              />
              <Field
                label={req('Designation')}
                name="designation"
                value={val('designation')}
                onChange={set('designation')}
                error={fieldErrors.designation}
                placeholder="e.g. Founder, Manager"
                required
              />
            </div>
            <CheckboxGroup
              label="Type of support"
              name="typeOfSupport"
              options={TYPE_OF_SUPPORT}
              values={arr('typeOfSupport')}
              onChange={(value) => setValue('typeOfSupport', value)}
              error={fieldErrors.typeOfSupport}
            />
            <Field
              label={req('Portfolio / work link')}
              name="portfolioLink"
              value={val('portfolioLink')}
              onChange={set('portfolioLink')}
              error={fieldErrors.portfolioLink}
              placeholder="Paste your website, portfolio, or relevant client work"
              required
            />
            <Field
              as="textarea"
              label="Message"
              name="message"
              value={val('message')}
              onChange={set('message')}
              error={fieldErrors.message}
              placeholder="what services you willing to offer"
            />
          </div>
        ) : null}

        {/* ---- Consent + submit (only once a role is chosen) ------------- */}
        {role ? (
          <>
            <Rule className="my-7" />
            <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-[18px] text-[#52526a]">
              <input
                type="checkbox"
                name="consent"
                checked={form.consent === true}
                onChange={(event) => setValue('consent', event.target.checked)}
                className={CONSENT_BOX}
              />
              <span>
                We use the information you provide only to respond to your enquiry and route it to
                the appropriate ATLAS Forge team.
              </span>
            </label>
            {fieldErrors.consent ? (
              <p role="alert" className="mt-2 text-xs font-medium text-forge-pink">
                {fieldErrors.consent}
              </p>
            ) : null}

            <div className="mt-6">
              <FormError message={formError} />
            </div>

            <div className="mt-6">
              <SubmitButton pending={pending} pendingLabel="Submitting…">
                Submit
              </SubmitButton>
            </div>
          </>
        ) : null}
      </form>
    </>
  )
}

/**
 * The Submitted frame. Reference: /reference/form/5 – Success.png — a tick, a
 * thank-you and the promise of a confirmation email (sent in a later phase).
 */
function SuccessPanel({ onAgain }) {
  return (
    <div className="mt-8 max-w-[640px]">
      <span className="flex size-[60px] items-center justify-center rounded-full bg-forge-ink text-white">
        <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" aria-hidden="true">
          <path d="M5 12l4.5 4.5L19 7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>

      <h1 className="mt-6 text-[28px] leading-tight font-medium text-[#3f3f4c] lg:text-[32px]">
        Thank you — your details are in.
      </h1>
      <p className="mt-3 text-[15px] leading-[22px] text-[#52526a]">
        The ATLAS Forge team will review your registration and get in touch on the email you shared.
        Your access is not active yet — you&rsquo;ll receive another email once your registration is
        approved.
      </p>

      <button
        type="button"
        onClick={onAgain}
        className={cn(
          'mt-7 inline-flex h-[46px] min-w-[176px] items-center justify-center rounded-[8px] px-7',
          'bg-[#3d3a8c] text-[12px] font-semibold tracking-[0.11em] text-white uppercase',
          'transition-colors duration-150 hover:bg-forge-ink'
        )}
      >
        Submit another response
      </button>
    </div>
  )
}
