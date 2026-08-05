'use client'

import { useMemo, useState } from 'react'
import { Avatar, Card, Chip, FilterTabs } from '@/components/ui'
import { forgeProjects, projectFilters } from '@/data/founder'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Founder/Projects.png       (3-up cards, own startup outlined)
 *            /reference/mast phone ui/Founder/Projects.png (compact rows)
 */
export default function ProjectsGrid() {
  const [filter, setFilter] = useState('All')

  const visible = useMemo(() => {
    if (filter === 'Hiring') return forgeProjects.filter((project) => project.hiring)
    if (filter === 'Featured') return forgeProjects.filter((project) => project.mine)
    return forgeProjects
  }, [filter])

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
          <Card
            key={project.id}
            padding="lg"
            className={cn('self-start', project.mine && 'border-primary-500')}
          >
            <div className="flex items-start justify-between gap-3">
              <Avatar
                initials={project.initial}
                tone={project.tone}
                variant="soft"
                shape="square"
                size="sm"
                className="text-[13px]"
              />
              {project.mine ? <Chip tone="info">My Startup</Chip> : null}
            </div>
            <h2 className="mt-3.5 text-[22px] font-bold text-ink">{project.name}</h2>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Chip key={tag} tone="skill" size="lg">
                  {tag}
                </Chip>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-[18px] text-muted">
              {project.description}
            </p>
            <p className="mt-3 text-[13px] text-muted">Team size: {project.teamSize}</p>
            {project.hiring ? (
              <Chip tone="success" size="lg" className="mt-3">
                Actively Hiring
              </Chip>
            ) : null}
          </Card>
        ))}
      </div>

      <ul className="space-y-3 lg:hidden">
        {forgeProjects.map((project) => (
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
              <p className="mt-3 text-[13px] text-muted">{project.mobileMeta}</p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
