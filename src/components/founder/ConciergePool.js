'use client'

import { useMemo, useState } from 'react'
import {
  Avatar,
  Banner,
  Button,
  Card,
  CardHeader,
  Chip,
  ConfirmDialog,
  FilterTabs,
  StatCard,
} from '@/components/ui'
import { conciergeContactLog, poolFilters, studentPool } from '@/data/founder'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Founder/Concierge.png       (list + detail + stats + log)
 *            /reference/mast phone ui/Founder/Concierge.png ("Student Pool" rows)
 */
export default function ConciergePool() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(studentPool[0].id)
  const [contacted, setContacted] = useState(null)

  const visible = useMemo(() => {
    if (filter === 'All') return studentPool
    if (filter === 'Available Now') return studentPool.filter((s) => s.available)
    return studentPool.filter((s) => s.track === filter)
  }, [filter])

  const selected =
    studentPool.find((student) => student.id === selectedId) ?? visible[0] ?? studentPool[0]

  return (
    <>
      <Banner tone="info" className="hidden lg:flex">
        All contact emails will CC Mihir Pawar automatically. Keep him in the loop for
        all work engagements.
      </Banner>

      <FilterTabs
        label="Filter the student pool"
        options={poolFilters}
        value={filter}
        onChange={setFilter}
        className="mt-[22px] hidden lg:flex"
      />

      {/* ---- Desktop: pool list + detail --------------------------------- */}
      <div className="mt-[22px] hidden gap-[22px] lg:grid lg:grid-cols-[380px_1fr] lg:items-start">
        <ul className="space-y-4">
          {visible.map((student) => {
            const active = student.id === selected.id
            return (
              <li key={student.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(student.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-card border bg-surface p-5 text-left shadow-card transition-colors',
                    active ? 'border-primary-500' : 'border-line hover:border-primary-200'
                  )}
                >
                  <div className="flex items-center gap-3.5">
                    <Avatar
                      initials={student.initials}
                      tone={student.tone}
                      shape="square"
                      size="lg"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-bold text-ink">
                        {student.name}
                      </p>
                      <p className="truncate text-[13px] text-muted">{student.meta}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {student.skills.map((skill) => (
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

        <div className="space-y-[22px]">
          <Card padding="lg" className="px-6 py-6">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="flex items-center gap-4">
                <Avatar
                  initials={selected.initials}
                  tone={selected.tone}
                  shape="square"
                  size="xl"
                  className="size-[62px] text-lg"
                />
                <div className="min-w-0">
                  <p className="text-[22px] font-bold text-ink">{selected.name}</p>
                  <p className="mt-1 text-sm text-muted">{selected.detailMeta}</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {selected.available ? <Chip tone="success">Available</Chip> : null}
                    {selected.skills.map((skill) => (
                      <Chip key={skill} tone="skill">
                        {skill}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5">
                <Button size="lg" onClick={() => setContacted(selected)}>
                  Contact Student
                </Button>
                <Button variant="subtle" size="lg">
                  View Full Profile
                </Button>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            {selected.stats.map((stat) => (
              <StatCard key={stat.label} {...stat} className="min-w-[110px]" />
            ))}
          </div>

          <Card padding="lg" className="px-6 py-5">
            <CardHeader title="Contact Log" />
            <ul className="mt-3 space-y-2">
              {conciergeContactLog.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center gap-3.5 rounded-tile border border-line-soft px-3.5 py-3"
                >
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-tile bg-primary-100 text-xs text-primary-text"
                  >
                    →
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
                    <p className="truncate text-[13px] text-muted">{entry.detail}</p>
                    <p className="truncate text-xs text-muted">{entry.meta}</p>
                  </div>
                  <Chip tone={entry.tone}>{entry.status}</Chip>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ---- Mobile: contact rows ---------------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {studentPool.map((student) => (
          <li
            key={student.id}
            className="flex items-center gap-3.5 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <Avatar
              initials={student.initials}
              tone={student.tone}
              shape="square"
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink">{student.name}</p>
              <p className="truncate text-[13px] text-muted">{student.mobileMeta}</p>
            </div>
            <Button
              variant="subtle"
              size="md"
              className="shrink-0 border-0 bg-primary-100 text-primary-text"
              onClick={() => setContacted(student)}
            >
              Contact
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(contacted)}
        onClose={() => setContacted(null)}
        title="Contact Sent!"
        description={
          contacted
            ? `Your message to ${contacted.name} has been sent. Mihir Pawar is CC'd on this outreach.`
            : ''
        }
      />
    </>
  )
}
