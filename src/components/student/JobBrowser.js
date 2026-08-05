'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { Button, Card, Chip, ConfirmDialog, FilterTabs } from '@/components/ui'
import { jobFilters, jobs, mobileJobs } from '@/data/student'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Student/Browse Jobs.png       (400px list + 739px detail)
 *            /reference/mast phone ui/Student/Browse Jobs.png (stacked list)
 *            /reference/mast ui/Overlay/Student Browse Jobs Applied.png
 *
 * Note: in the mobile reference each card's Apply button is clipped by a
 * fixed-height frame. Cards here hug their content so the button is fully
 * visible; every element drawn is preserved.
 */
export default function JobBrowser() {
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(jobs[0].id)
  const [appliedIds, setAppliedIds] = useState(
    () => new Set(jobs.filter((job) => job.applied).map((job) => job.id))
  )
  const [confirmed, setConfirmed] = useState(null)

  const visibleJobs = useMemo(
    () => (filter === 'All' ? jobs : jobs.filter((job) => job.type === filter)),
    [filter]
  )

  const selected = jobs.find((job) => job.id === selectedId) ?? visibleJobs[0] ?? jobs[0]
  const isApplied = appliedIds.has(selected.id)

  function apply(job) {
    setAppliedIds((prev) => new Set(prev).add(job.id))
    setConfirmed(job)
  }

  return (
    <>
      <FilterTabs
        label="Filter jobs by type"
        options={jobFilters}
        value={filter}
        onChange={setFilter}
        className="hidden lg:flex"
      />

      {/* ---- Desktop: list + detail ------------------------------------- */}
      <div className="mt-[18px] hidden gap-[18px] lg:grid lg:grid-cols-[400px_1fr]">
        <ul className="space-y-4">
          {visibleJobs.map((job) => {
            const active = job.id === selected.id
            return (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(job.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-card border bg-surface p-5 text-left shadow-card transition-colors',
                    active ? 'border-primary-300' : 'border-line hover:border-primary-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[15px] font-bold text-ink">{job.title}</h2>
                    <Chip tone={job.status === 'Collab' ? 'info' : 'success'}>
                      {job.status}
                    </Chip>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted">
                    {job.company} · {job.type}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {job.skills.map((skill) => (
                      <Chip key={skill} tone="skill">
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </button>
              </li>
            )
          })}
        </ul>

        {/* Stretches to the list's height, as drawn in the reference. */}
        <Card padding="none" className="p-6">
          <h2 className="text-[22px] font-bold text-ink">{selected.title}</h2>
          <p className="mt-2.5 text-sm text-muted">{selected.detailMeta}</p>
          <p className="mt-3 max-w-[640px] text-sm leading-[22px] text-muted">
            {selected.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.detailSkills.map((skill) => (
              <Chip key={skill} tone="skill" size="lg">
                {skill}
              </Chip>
            ))}
          </div>
          <Button
            size="xl"
            className="mt-5"
            disabled={isApplied}
            onClick={() => apply(selected)}
          >
            {isApplied ? 'Applied ✓' : 'Apply for this Role'}
          </Button>
        </Card>
      </div>

      {/* ---- Mobile: stacked list --------------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {mobileJobs.map((job) => {
          const applied = appliedIds.has(job.id) || job.applied
          return (
            <li
              key={job.id}
              className={cn(
                'rounded-card border p-4 shadow-card',
                applied ? 'border-success-fill/20 bg-success-fill/8' : 'border-line bg-surface'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <h2
                  className={cn(
                    'text-[15px] font-bold',
                    applied ? 'text-success' : 'text-ink'
                  )}
                >
                  {job.title}
                </h2>
                <Chip tone={job.type === 'Contract' ? 'danger' : 'success'}>
                  {job.type}
                </Chip>
              </div>
              <p className="mt-1 text-[13px] text-muted">{job.company}</p>
              {applied ? (
                <p className="mt-3 text-[13px] font-semibold text-success">Applied ✓</p>
              ) : (
                <Button size="sm" className="mt-3" onClick={() => apply(job)}>
                  Apply
                </Button>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={Boolean(confirmed)}
        onClose={() => setConfirmed(null)}
        title="Application Sent!"
        description={
          confirmed
            ? `Your application for ${confirmed.title} at ${confirmed.company} has been sent. Track its status in My Applications.`
            : ''
        }
        secondaryLabel="Back to Jobs"
        primaryLabel="View My Applications"
        onPrimary={() => router.push('/student/applications')}
      />
    </>
  )
}
