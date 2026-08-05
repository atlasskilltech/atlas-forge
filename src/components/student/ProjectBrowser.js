'use client'

import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Chip, FilterTabs } from '@/components/ui'
import { projectFilters, startups } from '@/data/student'

/**
 * Reference: /reference/mast ui/Student/Browse Projects.png       (3-up card grid)
 *            /reference/mast phone ui/Student/Browse Projects.png (rows + See Roles)
 */
export default function ProjectBrowser() {
  const [filter, setFilter] = useState('All')

  const visible = useMemo(() => {
    if (filter === 'All') return startups
    if (filter === 'Actively Hiring') return startups.filter((s) => s.hiring)
    if (filter === 'New This Month') return startups
    return startups.filter((s) => s.sector === filter)
  }, [filter])

  return (
    <>
      <FilterTabs
        label="Filter startups"
        options={projectFilters}
        value={filter}
        onChange={setFilter}
        className="hidden lg:flex"
      />

      {/* ---- Desktop grid ------------------------------------------------ */}
      <div className="mt-[18px] hidden gap-[18px] lg:grid lg:grid-cols-3">
        {visible.map((startup) => (
          <Card key={startup.id} padding="lg" className="self-start">
            <div className="flex items-start justify-between gap-3">
              <Avatar
                initials={startup.initial}
                tone={startup.tone}
                shape="square"
                size="lg"
                className="text-base"
              />
              {startup.hiring ? <Chip tone="success">Hiring</Chip> : null}
            </div>
            <h2 className="mt-3.5 text-[22px] font-bold text-ink">{startup.name}</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {startup.tags.map((tag) => (
                <Chip key={tag} tone="skill" size="lg">
                  {tag}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">{startup.description}</p>
            {startup.openRoles > 0 ? (
              <p className="mt-3 text-[13px] font-semibold text-primary-text">
                {startup.openRoles} open roles
              </p>
            ) : null}
            <div className="mt-3.5 flex flex-wrap gap-2">
              <Button variant="secondary" size="lg">
                View Startup
              </Button>
              {startup.openRoles > 0 ? <Button size="lg">See Roles</Button> : null}
            </div>
          </Card>
        ))}
      </div>

      {/* ---- Mobile rows -------------------------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {startups.map((startup) => (
          <li
            key={startup.id}
            className="flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
          >
            <Avatar
              initials={startup.initial}
              tone={startup.tone}
              shape="square"
              size="lg"
              className="text-base"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-bold text-ink">{startup.name}</p>
              <p className="truncate text-[13px] text-muted">
                {startup.sector} ·{' '}
                {startup.openRoles > 0 ? `${startup.openRoles} open roles` : 'Collab only'}
              </p>
            </div>
            <Button variant="secondary" size="md" className="shrink-0">
              See Roles
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}
