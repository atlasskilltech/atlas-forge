'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { ActionDialog, Avatar, Button, Card, Chip, FilterTabs } from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/FM/Approval Queue.png       (solid green Approve)
 *            /reference/mast phone ui/FM/Approval Queue.png (tinted Approve)
 *            /reference/mast ui/Overlay/FM Approval Queue {Approve,Reject} Confirm.png
 *
 * A decision is a real write: it records the verdict against this role, moves
 * the listing and notifies the founder in one transaction. `decision` is the
 * Forge Manager's own recorded verdict, which is not always the listing's
 * status — a Backend Manager override can leave a listing live that was
 * rejected here.
 */
export default function ApprovalQueue({ items = [], tabs = [] }) {
  const router = useRouter()
  const [tab, setTab] = useState(tabs[0])
  const [pending, setPending] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [, startTransition] = useTransition()

  const visible = useMemo(() => {
    if (tab === 'Approved') return items.filter((item) => item.decision === 'approved')
    if (tab === 'Rejected') return items.filter((item) => item.decision === 'rejected')

    const undecided = items.filter((item) => !item.decision)
    if (tab?.startsWith('Job Listings')) return undecided.filter((item) => item.kind === 'job')
    if (tab?.startsWith('Collab Posts')) return undecided.filter((item) => item.kind === 'collab')
    return undecided
  }, [tab, items])

  async function confirm() {
    setSubmitting(true)
    try {
      await api.post('/api/forge/approvals', {
        listingId: pending.item.listingId,
        decision: pending.action,
      })
      setPending(null)
      startTransition(() => router.refresh())
    } finally {
      setSubmitting(false)
    }
  }

  function statusFor(item) {
    if (item.decision === 'approved') return { label: 'Approved', tone: 'success' }
    if (item.decision === 'rejected') return { label: 'Rejected', tone: 'danger' }
    return { label: item.status, tone: item.statusTone }
  }

  return (
    <>
      <FilterTabs
        label="Filter the approval queue"
        options={tabs}
        value={tab}
        onChange={setTab}
        className="hidden lg:flex"
      />

      {/* ---- Desktop rows ------------------------------------------------ */}
      <ul className="mt-[22px] hidden space-y-3 lg:block">
        {visible.map((item) => {
          const decided = Boolean(item.decision)
          return (
            <li key={item.id}>
              <Card className="flex items-center gap-4 px-5 py-4">
                <Avatar
                  initials={item.initial}
                  tone={item.tone}
                  variant="soft"
                  shape="square"
                  size="md"
                  className="text-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-ink">{item.title}</p>
                  <p className="truncate text-[13px] text-muted">{item.meta}</p>
                </div>
                <div className="hidden shrink-0 gap-2 xl:flex">
                  {item.skills.map((skill) => (
                    <Chip key={skill} tone="skill">
                      {skill}
                    </Chip>
                  ))}
                </div>
                {decided ? (
                  <Chip tone={statusFor(item).tone} size="lg">
                    {statusFor(item).label}
                  </Chip>
                ) : (
                  <>
                    <Button
                      variant="success"
                      size="lg"
                      onClick={() => setPending({ item, action: 'approved' })}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="lg"
                      onClick={() => setPending({ item, action: 'rejected' })}
                    >
                      Reject
                    </Button>
                  </>
                )}
                <button
                  type="button"
                  disabled
                  title="No row menu yet"
                  aria-label={`More options for ${item.title}`}
                  className="flex size-6 shrink-0 items-center justify-center rounded-control bg-canvas text-[11px] text-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  ⌄
                </button>
              </Card>
            </li>
          )
        })}
      </ul>

      {/* ---- Mobile cards ------------------------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {visible.map((item) => {
          const status = statusFor(item)
          return (
            <li key={item.id}>
              <Card padding="lg">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[15px] font-bold text-ink">
                    {item.mobileTitle ?? item.title}
                  </h2>
                  <Chip tone={status.tone}>{status.label}</Chip>
                </div>
                <p className="mt-2.5 text-[13px] text-muted">{item.mobileMeta}</p>
                {item.decision ? null : (
                <div className="mt-3 flex gap-2.5">
                  <Button
                    variant="approve"
                    leadingIcon="✓"
                    onClick={() => setPending({ item, action: 'approved' })}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="reject"
                    leadingIcon="✕"
                    onClick={() => setPending({ item, action: 'rejected' })}
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
        description="This makes the listing live immediately and notifies the founder."
        confirmLabel="Yes, Approve"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />

      <ActionDialog
        open={pending?.action === 'rejected'}
        onClose={() => setPending(null)}
        tone="danger"
        title="Reject This Listing?"
        description="This removes the listing from consideration and notifies the founder."
        confirmLabel="Yes, Reject"
        confirmDisabled={submitting}
        onConfirm={confirm}
      />
    </>
  )
}
