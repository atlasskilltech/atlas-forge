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
 * Reference: /reference/mast ui/Shared/My Profile.png
 *            /reference/mast phone ui/Shared/My Profile.png
 *
 * Used by the manager roles, whose profile screen is the shared one rather than
 * a role-specific design.
 *
 * Note: the reference draws this screen with its own ACCOUNT / PREFERENCES /
 * SUPPORT sidebar. It renders inside the current role's shell here, so the
 * role's navigation stays consistent — see the section notes.
 */
/**
 * @param {object} props.profile
 * @param {string} [props.endpoint]  Where edits are saved. Omitted for the
 *   view-only Super Admin, whose Save is disabled rather than silently inert.
 */
export default function SharedProfile({ profile: sharedProfile, endpoint }) {
  const router = useRouter()
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  async function handleSubmit(event) {
    event.preventDefault()
    if (!endpoint) return
    const form = new FormData(event.currentTarget)

    setSubmitting(true)
    try {
      // The reference shows current values as placeholders rather than values,
      // so an untouched field means "leave this as it is".
      await api.patch(endpoint, {
        name: form.get('fullName')?.trim() || sharedProfile.raw.name,
        email: form.get('email')?.trim() || sharedProfile.raw.email,
        bio: form.get('bio')?.trim() || sharedProfile.raw.bio,
      })
      setSaved(true)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Card padding="lg" className="lg:px-7 lg:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 lg:gap-5">
            <Avatar
              name={sharedProfile.name}
              initials={sharedProfile.initials}
              shape="square"
              size="xl"
              className="lg:size-[62px] lg:text-lg"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink lg:text-[22px]">
                {sharedProfile.name}
              </p>
              <p className="mt-0.5 text-[13px] text-muted lg:hidden">
                {sharedProfile.mobileRole}
              </p>
              <p className="mt-1 hidden text-sm text-muted lg:block">
                {sharedProfile.email} · {sharedProfile.appId}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {sharedProfile.roles.map((role, index) => (
                  <Chip key={role} tone={index === 0 ? 'info' : 'neutral'} size="lg">
                    {role}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            disabled
            title="Use the Personal Details form below"
            className="hidden shrink-0 lg:inline-flex"
          >
            Edit Profile
          </Button>
        </div>
      </Card>

      <Button variant="subtle" fullWidth disabled title="Profile editing has no screen yet" className="mt-4 h-11 lg:hidden">
        Edit Profile
      </Button>

      <SectionLabel className="mt-4 lg:mt-5">
        <span className="lg:hidden">Details</span>
        <span className="hidden lg:inline">Personal Details</span>
      </SectionLabel>

      {/* ---- Mobile: read-only cards ------------------------------------- */}
      <ul className="mt-2.5 space-y-3 lg:hidden">
        {[
          ['Full Name', sharedProfile.name],
          ['Email', sharedProfile.email],
          ['App ID', sharedProfile.appId],
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
          <FormField label="Full Name" name="fullName" size="lg" placeholder={sharedProfile.name} />
          <FormField
            label="Email"
            name="email"
            type="email"
            size="lg"
            placeholder={sharedProfile.email}
          />
          <FormField
            label="Bio"
            name="bio"
            as="textarea"
            rows={3}
            placeholder="A brief description visible to founders and mentors"
          />
          <Button type="submit" size="xl" disabled={submitting || !endpoint}>
            Save Changes
          </Button>
        </form>
      </Card>

      <div className="hidden lg:block">
        <SectionLabel className="mt-5">Platform Access</SectionLabel>
        <Card padding="lg" className="mt-3 flex flex-wrap items-center gap-4 px-6 py-5">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-ink">Roles &amp; Access</p>
            <p className="mt-1 text-[13px] text-muted">
              Your access level is managed by the Backend Manager. Contact{' '}
              {sharedProfile.name} to request changes.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            {sharedProfile.access.map((item, index) => (
              <Chip key={item} tone={index === 0 ? 'info' : 'neutral'} size="lg">
                {item}
              </Chip>
            ))}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={saved}
        onClose={() => setSaved(false)}
        title="Profile Updated"
        description="Your changes have been saved across all your roles on ATLAS Forge."
      />
    </>
  )
}
