'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { ActionDialog, Button, Card, Chip, ConfirmDialog } from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/FM/Incubation Applications.png
 *            /reference/mast ui/Overlay/FM Incubation Applications Grant Confirm.png
 *            /reference/mast ui/Overlay/FM Incubation Applications Granted.png
 */
export default function IncubationApplications({ applications = [] }) {
  const router = useRouter()
  const [pending, setPending] = useState(null)
  const [granted, setGranted] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  async function confirmGrant() {
    setSubmitting(true)
    try {
      await api.post('/api/forge/incubation', { applicationId: pending.applicationId })
      setGranted(pending)
      setPending(null)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="grid gap-[18px] lg:grid-cols-3">
        {applications.map((application) => (
          <Card key={application.id} padding="lg" className="self-start lg:px-5 lg:py-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-bold text-ink">{application.name}</h2>
              <Chip tone={application.granted ? 'success' : application.tone}>
                {application.granted ? 'Approved' : application.status}
              </Chip>
            </div>
            <p className="mt-3.5 text-[13px] text-muted">Founder: {application.founder}</p>
            <p className="mt-1.5 text-[13px] text-muted">Stage: {application.stage}</p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <Button
                size="lg"
                disabled={application.granted}
                onClick={() => setPending(application)}
              >
                {application.granted ? 'Access Granted' : 'Grant Founder Access'}
              </Button>
              <Button variant="secondary" size="lg" disabled title="No detail screen exists yet">
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
        confirmDisabled={submitting}
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
