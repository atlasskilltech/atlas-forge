'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  ConfirmDialog,
  FormField,
  ProgressRing,
  SegmentedControl,
} from '@/components/ui'
import { hiringStatuses, industries, stages } from '@/data/founder'
import { readinessItems } from '@/data/student'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Founder/Edit Listing.png and
 *            /reference/mast ui/Founder/Startup Profile Setup.png
 *
 * Those two frames are the identical form — only the heading and the confirmation
 * differ — so one component serves both routes via the `mode` prop.
 */
export default function StartupListingForm({ mode = 'edit' }) {
  const router = useRouter()
  const [industry, setIndustry] = useState(industries[0])
  const [stage, setStage] = useState(stages[0])
  const [hiring, setHiring] = useState(hiringStatuses[0])
  const [readiness, setReadiness] = useState({})
  const [saved, setSaved] = useState(false)

  const percent = useMemo(() => {
    const done = readinessItems.filter((item) => readiness[item.id]?.trim()).length
    return Math.round((done / readinessItems.length) * 100)
  }, [readiness])

  function handleSubmit(event) {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="grid gap-[22px] lg:grid-cols-[758px_1fr] lg:items-start"
      >
        <Card padding="none" className="px-4 py-5 lg:px-8 lg:py-7">
          <div className="space-y-5">
            <FormField
              label="Idea / Project Name"
              name="ideaName"
              placeholder="e.g. NovaMed — AI health monitoring"
              size="responsive"
              required
              requiredMark={false}
            />
            <FormField
              label="Tagline"
              name="tagline"
              placeholder="One line describing what you do — shown on your startup page"
              size="responsive"
            />
            <FormField
              label="Problem Statement"
              name="problem"
              as="textarea"
              rows={3}
              placeholder="What problem are you solving and for whom?"
            />

            <div className="space-y-2">
              <p className="text-[13px] leading-4 font-semibold text-ink">Industry</p>
              <SegmentedControl
                label="Industry"
                tone="primary"
                options={industries}
                value={industry}
                onChange={setIndustry}
              />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] leading-4 font-semibold text-ink">Current Stage</p>
              <SegmentedControl
                label="Current Stage"
                tone="primary"
                options={stages}
                value={stage}
                onChange={setStage}
              />
            </div>

            <div className="space-y-2">
              <p className="text-[13px] leading-4 font-semibold text-ink">Hiring status</p>
              <SegmentedControl
                label="Hiring status"
                tone="primary"
                options={hiringStatuses}
                value={hiring}
                onChange={setHiring}
              />
            </div>

            <FormField
              label="Open roles"
              name="openRoles"
              placeholder="e.g. 3"
              size="responsive"
              containerClassName="max-w-[240px]"
            />
            <FormField
              label="Team Members (App ID — Role)"
              name="team"
              placeholder="ATL-2024-0871 — CTO,  ATL-2023-0342 — Head of Design"
              size="responsive"
            />

            <div>
              <p className="text-[13px] leading-4 font-semibold text-ink">
                Startup Readiness
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Provide each item below. The readiness ring fills as you add them.
              </p>

              <div className="mt-3 space-y-3">
                {readinessItems.map((item) => {
                  const done = Boolean(readiness[item.id]?.trim())
                  return (
                    <div
                      key={item.id}
                      className="rounded-tile border border-line bg-canvas p-4"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            'mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-full border text-[10px]',
                            done
                              ? 'border-success-fill bg-success-fill text-white'
                              : 'border-line-soft bg-surface'
                          )}
                        >
                          {done ? '✓' : ''}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-ink">{item.label}</p>
                          <p className="mt-0.5 text-[13px] text-muted">{item.hint}</p>
                          <input
                            type="text"
                            aria-label={item.label}
                            placeholder={item.placeholder}
                            value={readiness[item.id] ?? ''}
                            onChange={(event) =>
                              setReadiness((prev) => ({
                                ...prev,
                                [item.id]: event.target.value,
                              }))
                            }
                            className="mt-3 h-10 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted focus:border-primary-500 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <Button type="submit" size="xl" fullWidth className="lg:w-auto">
              {mode === 'edit' ? 'Save Changes' : 'Save Startup Profile'}
            </Button>
          </div>
        </Card>

        <Card padding="lg" className="self-start px-6 py-6 text-center">
          <h2 className="text-base font-bold text-ink">Startup Readiness</h2>
          <p className="mt-2 text-[13px] text-muted">
            Fills as you provide each item on the left
          </p>
          <ProgressRing
            value={percent}
            label="Readiness"
            caption={percent > 0 ? `${percent}%` : undefined}
            className="mt-5"
          />
          <ul className="mt-5 space-y-2 text-left">
            {readinessItems.map((item) => {
              const done = Boolean(readiness[item.id]?.trim())
              return (
                <li key={item.id} className="flex items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      done ? 'bg-success-fill' : 'bg-primary-500'
                    )}
                  />
                  <span className={cn('text-[13px]', done ? 'text-ink' : 'text-muted')}>
                    {item.label}
                  </span>
                </li>
              )
            })}
          </ul>
        </Card>
      </form>

      <ConfirmDialog
        open={saved}
        onClose={() => setSaved(false)}
        title={mode === 'edit' ? 'Listing Updated' : 'Startup Profile Saved'}
        description={
          mode === 'edit'
            ? 'Your changes are live on the NovaMed startup page.'
            : 'Your startup details are saved. Your Founder dashboard is now unlocked.'
        }
        primaryLabel={mode === 'edit' ? 'View Startup Page' : 'Done'}
        onPrimary={
          mode === 'edit' ? () => router.push('/founder/startup') : () => setSaved(false)
        }
      />
    </>
  )
}
