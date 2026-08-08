'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button, Card, Chip, FilterTabs } from '@/components/ui'
import { api } from '@/lib/api/client'

/**
 * Reference: /reference/mast ui/FM/All Projects.png       (3-up manage cards)
 *            /reference/mast phone ui/FM/All Projects.png (compact rows)
 *
 * @param {string} [only]  Pre-filter to 'featured' or 'active' for the
 *   Featured / Active Startups routes, which share this screen's design.
 */
export default function ProjectsGrid({ only, projects: allProjects = [], filters = ['All'] }) {
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const [pendingId, setPendingId] = useState(null)
  const [, startTransition] = useTransition()

  const base = useMemo(() => {
    if (only === 'featured') return allProjects.filter((p) => p.featured)
    if (only === 'active') return allProjects.filter((p) => p.status === 'Active')
    return allProjects
  }, [only, allProjects])

  async function toggleFeatured(project) {
    setPendingId(project.id)
    try {
      await api.patch('/api/forge/projects', {
        startupId: project.startupId,
        featured: !project.featured,
      })
      startTransition(() => router.refresh())
    } finally {
      setPendingId(null)
    }
  }

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
        options={filters}
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
              <Button variant="secondary" size="lg" disabled title="No detail screen exists yet">
                View Page
              </Button>
              <Button
                variant="secondary"
                size="lg"
                leadingIcon="⭐"
                disabled={pendingId === project.id}
                onClick={() => toggleFeatured(project)}
              >
                {project.featured ? 'Unfeature' : 'Feature'}
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
