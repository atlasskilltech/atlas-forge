'use client'

import { useState } from 'react'
import { Button, Card, ConfirmDialog, SectionLabel, Toggle } from '@/components/ui'
import SkillTagRow from './SkillTagRow'
import { studentProfile } from '@/data/student'

/**
 * Reference: /reference/mast ui/Student/Concierge.png        ("My Concierge Profile")
 *            /reference/mast phone ui/Student/Concierge.png  ("Flag My Availability")
 */
export default function AvailabilityPanel() {
  const [available, setAvailable] = useState(true)
  const [saved, setSaved] = useState(false)

  return (
    <>
      {/* ---- Desktop: availability + skills panels ----------------------- */}
      <div className="hidden lg:block">
        <Card padding="lg" className="px-7 py-7">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2 className="text-base font-bold text-ink">Availability Status</h2>
              <p className="mt-3.5 text-sm text-muted">{studentProfile.concierge}</p>
            </div>
            <Toggle
              checked={available}
              onChange={setAvailable}
              label="Visible to founders in the Concierge pool"
            />
          </div>
        </Card>

        <SectionLabel className="mt-5">My Skills</SectionLabel>
        <Card padding="lg" className="mt-3 px-7 py-7">
          <SkillTagRow skills={studentProfile.skills} />
          <p className="mt-5 text-[13px] text-muted">
            {studentProfile.programme} · {studentProfile.year} · ATLAS SkillTech
            University · {studentProfile.appId}
          </p>
          <Button variant="secondary" size="lg" className="mt-4">
            Edit Skills Profile
          </Button>
        </Card>
      </div>

      {/* ---- Mobile: summary card + update CTA --------------------------- */}
      <div className="lg:hidden">
        <Card padding="lg">
          <dl className="space-y-4">
            {[
              ['Hours per week', studentProfile.hoursPerWeek],
              ['Type of work', studentProfile.workTypes],
              ['Availability', studentProfile.timing],
            ].map(([term, detail]) => (
              <div key={term}>
                <dt className="text-xs text-muted">{term}</dt>
                <dd className="mt-0.5 text-[15px] font-semibold text-ink">{detail}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Button fullWidth className="mt-4 h-12" onClick={() => setSaved(true)}>
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
