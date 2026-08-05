'use client'

import { useMemo, useState } from 'react'
import { ActionDialog, Avatar, Button, Card, Chip, FilterTabs } from '@/components/ui'
import { approvalQueue, approvalTabs } from '@/data/forge'

/**
 * Reference: /reference/mast ui/FM/Approval Queue.png       (solid green Approve)
 *            /reference/mast phone ui/FM/Approval Queue.png (tinted Approve)
 *            /reference/mast ui/Overlay/FM Approval Queue {Approve,Reject} Confirm.png
 */
export default function ApprovalQueue() {
  const [tab, setTab] = useState(approvalTabs[0])
  const [decisions, setDecisions] = useState({})
  const [pending, setPending] = useState(null)

  const visible = useMemo(() => {
    if (tab === approvalTabs[0]) return approvalQueue
    if (tab === 'Approved') {
      return approvalQueue.filter((item) => decisions[item.id] === 'approved')
    }
    if (tab === 'Rejected') {
      return approvalQueue.filter((item) => decisions[item.id] === 'rejected')
    }
    return approvalQueue.filter((item) => item.kind === tab)
  }, [tab, decisions])

  function confirm() {
    setDecisions((prev) => ({ ...prev, [pending.item.id]: pending.action }))
    setPending(null)
  }

  function statusFor(item) {
    const decision = decisions[item.id]
    if (decision === 'approved') return { label: 'Approved', tone: 'success' }
    if (decision === 'rejected') return { label: 'Rejected', tone: 'danger' }
    return { label: item.status, tone: item.status === 'Approved' ? 'success' : 'warning' }
  }

  return (
    <>
      <FilterTabs
        label="Filter the approval queue"
        options={approvalTabs}
        value={tab}
        onChange={setTab}
        className="hidden lg:flex"
      />

      {/* ---- Desktop rows ------------------------------------------------ */}
      <ul className="mt-[22px] hidden space-y-3 lg:block">
        {visible.map((item) => {
          const decided = Boolean(decisions[item.id])
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
                  aria-label={`More options for ${item.title}`}
                  className="flex size-6 shrink-0 items-center justify-center rounded-control bg-canvas text-[11px] text-muted"
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
        {approvalQueue.map((item) => {
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
        onConfirm={confirm}
      />

      <ActionDialog
        open={pending?.action === 'rejected'}
        onClose={() => setPending(null)}
        tone="danger"
        title="Reject This Listing?"
        description="This removes the listing from consideration and notifies the founder."
        confirmLabel="Yes, Reject"
        onConfirm={confirm}
      />
    </>
  )
}
