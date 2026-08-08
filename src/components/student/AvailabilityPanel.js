'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Button, Card, ConfirmDialog, SectionLabel, Toggle } from '@/components/ui'
import SkillTagRow from './SkillTagRow'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/Student/Concierge.png        ("My Concierge Profile")
 *            /reference/mast phone ui/Student/Concierge.png  ("Flag My Availability")
 *
 * The toggle writes immediately — it is the switch that puts a student in or
 * out of the Concierge pool, and the reference gives it no Save button. If the
 * request fails the switch returns to its previous position rather than
 * showing a state the database does not hold.
 */
export default function AvailabilityPanel({ profile }) {
  const router = useRouter()
  const [available, setAvailable] = useState(profile.isAvailable)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [, startTransition] = useTransition()

  async function save(nextAvailable) {
    const previous = available
    setAvailable(nextAvailable)
    setSaving(true)
    try {
      await api.put('/api/student/availability', {
        isAvailable: nextAvailable,
        hoursPerWeek: profile.raw.hoursPerWeek,
        workTypes: profile.raw.workTypes,
        timing: profile.raw.timing,
      })
      startTransition(() => router.refresh())
      return true
    } catch {
      setAvailable(previous)
      return false
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      {/* ---- Desktop: availability + skills panels ----------------------- */}
      <div className="hidden lg:block">
        <Card padding="lg" className="px-7 py-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-base font-bold text-ink">Availability Status</h2>
              <p className="mt-3.5 text-sm text-muted">{profile.concierge}</p>
            </div>
            <Toggle
              checked={available}
              onChange={save}
              label="Visible to founders in the Concierge pool"
            />
          </div>
        </Card>

        <SectionLabel className="mt-5">My Skills</SectionLabel>
        <Card padding="lg" className="mt-3 px-7 py-7">
          <SkillTagRow skills={profile.skills} />
          <p className="mt-5 text-[13px] text-muted">
            {profile.programme} · {profile.year} · ATLAS SkillTech
            University · {profile.appId}
          </p>
          <Button
            variant="secondary"
            size="lg"
            disabled
            title="Editing skills needs a picker, which is not designed yet"
            className="mt-4"
          >
            Edit Skills Profile
          </Button>
        </Card>
      </div>

      {/* ---- Mobile: summary card + update CTA --------------------------- */}
      <div className="lg:hidden">
        <Card padding="lg">
          <dl className="space-y-4">
            {[
              ['Hours per week', profile.hoursPerWeek],
              ['Type of work', profile.workTypes],
              ['Availability', profile.timing],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-xs text-muted">{term}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-ink">{detail}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* Disabled while the request is in flight. Every other write in the
            app already guards this way; without it a second tap sends a second
            PUT and can race the first one's response. The label is unchanged —
            only the button's availability is. */}
        <Button
          fullWidth
          className="mt-4 h-12"
          disabled={saving}
          onClick={async () => {
            if (await save(available)) setSaved(true)
          }}
        >
          Update Availability
        </Button>
      </div>

      <ConfirmDialog
        open={saved}
        onClose={() => setSaved(false)}
        title="Availability Updated"
        description="Founders searching the Concierge pool will now see your latest availability."
      />
    </>
  )
}
