'use client'

import { useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  FilterTabs,
  SectionLabel,
  StatCard,
} from '@/components/ui'
import { poolFilters, students } from '@/data/forge'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/FM/Student Pool.png       (list + detail + 3 actions)
 *            /reference/mast phone ui/FM/Student Pool.png (compact rows)
 */
export default function StudentPoolBrowser() {
  const [filter, setFilter] = useState('All')
  const [selectedId, setSelectedId] = useState(students[0].id)
  const [contacted, setContacted] = useState(null)

  const visible = useMemo(() => {
    if (filter === 'All') return students
    if (filter === 'Available Now') return students.filter((s) => s.available)
    return students.filter((s) => s.track === filter)
  }, [filter])

  const selected =
    students.find((student) => student.id === selectedId) ?? visible[0] ?? students[0]

  return (
    <>
      <FilterTabs
        label="Filter the student pool"
        options={poolFilters}
        value={filter}
        onChange={setFilter}
        className="hidden lg:flex"
      />

      <div className="mt-[22px] hidden gap-[18px] lg:grid lg:grid-cols-[360px_1fr] lg:items-start">
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
                    active ? 'border-primary-300' : 'border-line hover:border-primary-200'
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

        <Card padding="none" className="p-6">
          <div className="flex items-center gap-4">
            <Avatar
              initials={selected.initials}
              tone={selected.tone}
              shape="square"
              size="xl"
              className="size-[54px] text-base"
            />
            <div className="min-w-0">
              <p className="text-[22px] font-bold text-ink">{selected.name}</p>
              <p className="mt-1 text-sm text-muted">{selected.detailMeta}</p>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {selected.available ? <Chip tone="success">Available</Chip> : null}
            {selected.detailSkills.map((skill) => (
              <Chip key={skill} tone="skill">
                {skill}
              </Chip>
            ))}
          </div>

          <SectionLabel className="mt-5">Availability &amp; Engagement</SectionLabel>
          <div className="mt-3 flex flex-wrap gap-3">
            {selected.stats.map((stat) => (
              <StatCard key={stat.label} {...stat} className="min-w-[110px]" />
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button size="lg" onClick={() => setContacted(selected)}>
              Contact Student
            </Button>
            <Button variant="secondary" size="lg">
              View Full Profile
            </Button>
            <Button variant="secondary" size="lg">
              Assign to Project
            </Button>
          </div>
        </Card>
      </div>

      <ul className="space-y-3 lg:hidden">
        {students.map((student) => (
          <li key={student.id}>
            <Card padding="lg" className="flex items-center gap-3.5">
              <Avatar
                initials={student.initials}
                tone={student.tone}
                shape="square"
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{student.name}</p>
                <p className="truncate text-[13px] text-muted">{student.mobileMeta}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={Boolean(contacted)}
        onClose={() => setContacted(null)}
        title="Contact Sent!"
        description={
          contacted ? `Your message to ${contacted.name} has been sent.` : ''
        }
      />
    </>
  )
}
