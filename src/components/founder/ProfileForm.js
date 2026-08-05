'use client'

import { useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  FormField,
  SectionLabel,
} from '@/components/ui'
import { founderProfile } from '@/data/founder'

/**
 * Reference: /reference/mast ui/Founder/My Profile.png
 *            /reference/mast phone ui/Founder/My Profile.png
 *            /reference/mast ui/Overlay/Founder My Profile Saved.png
 *
 * Mobile shows read-only detail cards with an "Edit Profile" affordance above;
 * desktop shows the same values as an editable form.
 */
export default function ProfileForm() {
  const [saved, setSaved] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <>
      <Card padding="lg" className="lg:px-7 lg:py-7">
        <div className="flex items-center gap-3.5 lg:gap-5">
          <Avatar
            name={founderProfile.name}
            initials={founderProfile.initials}
            shape="square"
            size="xl"
            className="lg:size-[52px] lg:text-base"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold text-ink lg:text-[22px]">
              {founderProfile.name}
            </p>
            <p className="mt-0.5 text-[13px] text-muted lg:hidden">
              {founderProfile.role} · {founderProfile.startup} · {founderProfile.appId}
            </p>
            <p className="mt-1 hidden text-sm text-muted lg:block">
              {founderProfile.role} · {founderProfile.startup} · {founderProfile.appId} ·{' '}
              {founderProfile.email}
            </p>
            <Chip tone="info" size="lg" className="mt-2">
              {founderProfile.badge}
            </Chip>
          </div>
        </div>
      </Card>

      <Button variant="subtle" fullWidth className="mt-4 h-11 lg:hidden">
        Edit Profile
      </Button>

      <SectionLabel className="mt-4 lg:mt-5">
        <span className="lg:hidden">Details</span>
        <span className="hidden lg:inline">Profile Details</span>
      </SectionLabel>

      {/* ---- Mobile: read-only detail cards ------------------------------ */}
      <ul className="mt-2.5 space-y-3 lg:hidden">
        {[
          ['Full Name', founderProfile.name],
          ['Email', founderProfile.email],
          ['App ID', founderProfile.appId],
          ['Startup', founderProfile.startup],
        ].map(([term, detail]) => (
          <li key={term}>
            <Card padding="lg">
              <p className="text-xs text-muted">{term}</p>
              <p className="mt-1 text-[15px] font-semibold text-ink">{detail}</p>
            </Card>
          </li>
        ))}
      </ul>

      <Button fullWidth className="mt-4 h-12 lg:hidden" onClick={() => setSaved(true)}>
        Save Changes
      </Button>

      {/* ---- Desktop: editable form -------------------------------------- */}
      <Card padding="none" className="mt-3 hidden lg:block lg:px-8 lg:py-7">
        <form onSubmit={handleSubmit} className="space-y-[22px]">
          <FormField
            label="Full Name"
            name="fullName"
            size="lg"
            placeholder={founderProfile.name}
          />
          <FormField
            label="Email"
            name="email"
            type="email"
            size="lg"
            placeholder={founderProfile.email}
          />
          <FormField
            label="Startup"
            name="startup"
            size="lg"
            placeholder={founderProfile.startup}
          />
          <FormField
            label="Bio / About"
            name="bio"
            as="textarea"
            rows={3}
            placeholder={founderProfile.bio}
          />
          <Button type="submit" size="xl">
            Save Changes
          </Button>
        </form>
      </Card>

      <ConfirmDialog
        open={saved}
        onClose={() => setSaved(false)}
        title="Profile Updated"
        description="Your changes have been saved."
      />
    </>
  )
}
