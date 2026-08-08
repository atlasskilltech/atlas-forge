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
  SectionLabel,
} from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/Founder/My Profile.png
 *            /reference/mast phone ui/Founder/My Profile.png
 *            /reference/mast ui/Overlay/Founder My Profile Saved.png
 *
 * Mobile shows read-only detail cards with an "Edit Profile" affordance above;
 * desktop shows the same values as an editable form.
 */
export default function ProfileForm({ profile }) {
  const router = useRouter()
  const founderProfile = profile
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [, startTransition] = useTransition()

  async function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)

    setSubmitting(true)
    setError(null)
    try {
      await api.patch('/api/founder/profile', {
        // The reference shows the current values as placeholders rather than
        // as values, so an untouched field means "leave this as it is".
        name: form.get('fullName')?.trim() || profile.raw.name,
        email: form.get('email')?.trim() || profile.raw.email,
        bio: form.get('bio')?.trim() || profile.raw.bio,
      })
      setSaved(true)
      startTransition(() => router.refresh())
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
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

      <Button variant="subtle" fullWidth disabled title="Profile editing has no screen yet" className="mt-4 h-11 lg:hidden">
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

      {/* The mobile frames draw read-only detail cards above this button —
          there is no field to edit and so nothing to submit. It stays visible
          and disabled until an edit screen is designed, rather than reporting a
          save that never happened. */}
      <Button fullWidth className="mt-4 h-12 lg:hidden" disabled>
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
          <Button type="submit" size="xl" disabled={submitting}>
            Save Changes
          </Button>
          {error ? (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          ) : null}
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
