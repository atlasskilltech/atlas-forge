'use client'

import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Chip, FilterTabs } from '@/components/ui'

/**
 * Reference: /reference/mast ui/Student/Browse Projects.png       (3-up card grid)
 *            /reference/mast phone ui/Student/Browse Projects.png (rows + See Roles)
 *
 * "New This Month" now filters on the startup's creation date. The mock data
 * had no date behind it, so that tab previously returned everything.
 */
export default function ProjectBrowser({ projects = [], filters = ['All'] }) {
  const [filter, setFilter] = useState('All')

  const visible = useMemo(() => {
    if (filter === 'All') return projects
    if (filter === 'Actively Hiring') return projects.filter((project) => project.hiring)
    if (filter === 'New This Month') return projects.filter((project) => project.isNew)
    return projects.filter((project) => project.sector === filter)
  }, [filter, projects])

  return (
    <>
      <FilterTabs
        label="Filter startups"
        options={filters}
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
              <Button variant="secondary" size="lg" disabled title="No detail screen exists yet">
                View Startup
              </Button>
              {startup.openRoles > 0 ? (
                <Button size="lg" disabled title="Browse Jobs cannot yet filter by startup">
                  See Roles
                </Button>
              ) : null}
            </div>
          </Card>
        ))}
      </div>

      {/* ---- Mobile rows -------------------------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {visible.map((startup) => (
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
            <Button
              variant="secondary"
              size="md"
              disabled
              title="Browse Jobs cannot yet filter by startup"
              className="shrink-0"
            >
              See Roles
            </Button>
          </li>
        ))}
      </ul>
    </>
  )
}
