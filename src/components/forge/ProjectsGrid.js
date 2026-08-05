'use client'

import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Chip, FilterTabs } from '@/components/ui'
import { allProjects, projectFilters } from '@/data/forge'

/**
 * Reference: /reference/mast ui/FM/All Projects.png       (3-up manage cards)
 *            /reference/mast phone ui/FM/All Projects.png (compact rows)
 *
 * @param {string} [only]  Pre-filter to 'featured' or 'active' for the
 *   Featured / Active Startups routes, which share this screen's design.
 */
export default function ProjectsGrid({ only }) {
  const [filter, setFilter] = useState('All')

  const base = useMemo(() => {
    if (only === 'featured') return allProjects.filter((p) => p.featured)
    if (only === 'active') return allProjects.filter((p) => p.status === 'Active')
    return allProjects
  }, [only])

  const visible = useMemo(() => {
    if (filter === 'All') return base
    if (filter === 'Hiring') return base.filter((p) => p.openRoles > 0)
    if (filter === 'Featured') return base.filter((p) => p.featured)
    return base.filter((p) => p.sector === filter)
  }, [base, filter])

  return (
    <>
      <FilterTabs
        label="Filter projects"
        options={projectFilters}
        value={filter}
        onChange={setFilter}
        className="hidden lg:flex"
      />

      <div className="mt-[22px] hidden gap-[18px] lg:grid lg:grid-cols-3">
        {visible.map((project) => (
          <Card key={project.id} padding="lg" className="self-start">
            <div className="flex items-start justify-between gap-3">
              <Avatar
                initials={project.initial}
                tone={project.tone}
                shape="square"
                size="sm"
                className="text-[13px]"
              />
              <Chip tone={project.statusTone}>{project.status}</Chip>
            </div>
            <h2 className="mt-3.5 text-[22px] font-bold text-ink">{project.name}</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Chip key={tag} tone="skill" size="lg">
                  {tag}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">Founder: {project.founder}</p>
            <p className="mt-1.5 text-[13px] text-muted">
              Team: {project.team} · Open Roles: {project.openRoles}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-2.5">
              <Button variant="secondary" size="lg">
                View Page
              </Button>
              <Button variant="secondary" size="lg" leadingIcon="⭐">
                Feature
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <ul className="space-y-3 lg:hidden">
        {visible.map((project) => (
          <li key={project.id}>
            <Card padding="lg">
              <div className="flex items-center gap-3">
                <Avatar
                  initials={project.initial}
                  tone={project.tone}
                  shape="square"
                  size="md"
                />
                <p className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                  {project.name}
                </p>
                <Chip tone="skill">{project.sector}</Chip>
              </div>
              <p className="mt-3 text-[13px] text-muted">
                Founder: {project.founder} · Team {project.team}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
