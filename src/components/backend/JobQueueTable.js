'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { ActionDialog, Button, Card, Chip, DataTable, FilterTabs } from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/BM/Job Approval Queue.png (7-column override table)
 *            /reference/mast ui/Overlay/BM Job Approval Queue {Approve,Reject} Confirm.png
 *
 * Backend Manager decisions sit alongside the Forge Manager's rather than
 * replacing them, so the FM Decision column stays visible after this role acts
 * and `override` carries what this role decided.
 */
export default function JobQueueTable({ rows: jobQueue = [], tabs: queueTabs = [] }) {
  const router = useRouter()
  const [tab, setTab] = useState(queueTabs[0])
  const [pending, setPending] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const visible = useMemo(() => {
    if (tab === 'All Pending') return jobQueue
    if (tab === 'Job Listings') return jobQueue.filter((row) => row.kind === 'Job')
    if (tab === 'Collab Posts') return jobQueue.filter((row) => row.kind === 'Collab')
    // Approved and Rejected read this role's own verdict where it has one, and
    // fall back to the Forge Manager's where it has not.
    if (tab === 'Approved') {
      return jobQueue.filter((row) =>
        row.override ? row.override === 'approved' : row.decision === 'Approved'
      )
    }
    return jobQueue.filter((row) =>
      row.override ? row.override === 'rejected' : row.decision === 'Rejected'
    )
  }, [tab, jobQueue])

  async function confirm() {
    setSubmitting(true)
    try {
      await api.post('/api/backend/job-queue', {
        listingId: pending.row.listingId,
        decision: pending.action,
      })
      setPending(null)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    { key: 'kind', label: 'Type' },
    { key: 'title', label: 'Title' },
    { key: 'startup', label: 'Startup' },
    { key: 'by', label: 'Posted By' },
    { key: 'date', label: 'Date' },
    { key: 'decision', label: 'FM Decision' },
    { key: 'actions', label: 'Actions' },
  ]

  const rows = visible.map((row) => {
    const decided = row.override
    return {
      id: row.id,
      kind: (
        <Chip tone={row.kind === 'Collab' ? 'info' : 'warning'}>{row.kind}</Chip>
      ),
      title: row.title,
      startup: row.startup,
      by: <span className="text-primary-text">{row.by}</span>,
      date: row.date,
      decision: <Chip tone={row.tone}>{row.decision}</Chip>,
      actions: decided ? (
        <Chip tone={decided === 'approved' ? 'success' : 'danger'}>
          {decided === 'approved' ? 'Approved' : 'Rejected'}
        </Chip>
      ) : (
        <span className="flex items-center gap-2">
          <Button
            variant="approve"
            size="sm"
            onClick={() => setPending({ row, action: 'approved' })}
          >
            Approve
          </Button>
          <Button
            variant="reject"
            size="sm"
            onClick={() => setPending({ row, action: 'rejected' })}
          >
            Reject
          </Button>
        </span>
      ),
    }
  })

  return (
    <>
      <FilterTabs
        label="Filter the job queue"
        options={queueTabs}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-4 hidden lg:block">
        <DataTable columns={columns} rows={rows} caption="Job and collab approval queue" />
      </div>

      <ul className="mt-4 space-y-3 lg:hidden">
        {visible.map((row) => {
          const decided = row.override
          return (
            <li key={row.id}>
              <Card padding="lg">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-bold text-ink">{row.title}</h2>
                  <Chip tone={decided ? (decided === 'approved' ? 'success' : 'danger') : row.tone}>
                    {decided ? (decided === 'approved' ? 'Approved' : 'Rejected') : row.decision}
                  </Chip>
                </div>
                <p className="mt-2.5 text-[13px] text-muted">
                  {row.startup} · {row.kind} · {row.date}
                </p>
                {decided ? null : (
                  <div className="mt-3 flex gap-2.5">
                    <Button
                      variant="approve"
                      leadingIcon="✓"
                      onClick={() => setPending({ row, action: 'approved' })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="reject"
                      leadingIcon="✕"
                      onClick={() => setPending({ row, action: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      <ActionDialog
        open={pending?.action === 'approved'}
        onClose={() => setPending(null)}
        tone="success"
        title="Approve This Listing?"
        description="This makes the listing live immediately and notifies the founder. This overrides the Forge Manager's decision."
        confirmLabel="Yes, Approve"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />

      <ActionDialog
        open={pending?.action === 'rejected'}
        onClose={() => setPending(null)}
        tone="danger"
        title="Reject This Listing?"
        description="This removes the listing from consideration and notifies the founder. This overrides the Forge Manager's decision."
        confirmLabel="Yes, Reject"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />
    </>
  )
}
