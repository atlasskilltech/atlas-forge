'use client'

import { useState } from 'react'
import { ActionDialog, Button, Card, Chip, ConfirmDialog } from '@/components/ui'
import { incubationApplications } from '@/data/forge'

/**
 * Reference: /reference/mast ui/FM/Incubation Applications.png
 *            /reference/mast ui/Overlay/FM Incubation Applications Grant Confirm.png
 *            /reference/mast ui/Overlay/FM Incubation Applications Granted.png
 */
export default function IncubationApplications() {
  const [pending, setPending] = useState(null)
  const [granted, setGranted] = useState(null)
  const [unlocked, setUnlocked] = useState({})

  function confirmGrant() {
    setUnlocked((prev) => ({ ...prev, [pending.id]: true }))
    setGranted(pending)
    setPending(null)
  }

  return (
    <>
      <div className="grid gap-[18px] lg:grid-cols-3">
        {incubationApplications.map((application) => (
          <Card key={application.id} padding="lg" className="self-start lg:px-5 lg:py-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">{application.name}</h2>
              <Chip tone={unlocked[application.id] ? 'success' : application.tone}>
                {unlocked[application.id] ? 'Approved' : application.status}
              </Chip>
            </div>
            <p className="mt-3.5 text-[13px] text-muted">Founder: {application.founder}</p>
            <p className="mt-1.5 text-[13px] text-muted">Stage: {application.stage}</p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <Button
                size="lg"
                disabled={Boolean(unlocked[application.id])}
                onClick={() => setPending(application)}
              >
                {unlocked[application.id] ? 'Access Granted' : 'Grant Founder Access'}
              </Button>
              <Button variant="secondary" size="lg">
                View Details
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ActionDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        tone="primary"
        title="Grant Founder Access?"
        description="This applicant gains Founder access immediately — Hiring, Concierge, and startup listing management unlock. Their incubation application will be marked approved."
        confirmLabel="Yes, Grant Access"
        onConfirm={confirmGrant}
      />

      <ConfirmDialog
        open={Boolean(granted)}
        onClose={() => setGranted(null)}
        title="Founder Access Granted"
        description={
          granted
            ? `${granted.founder} now has Founder access for ${granted.name}. They have been notified.`
            : ''
        }
      />
    </>
  )
}
