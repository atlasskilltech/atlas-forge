'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar, Card, Chip, FilterTabs, SectionLabel } from '@/components/ui'

/**
 * Staff oversight of every startup's document vault.
 *
 * No reference frame exists for this screen — the Compliance & Docs designs are
 * the founder's. It is assembled from the primitives the other Forge screens
 * use (the same card grid as Projects, the same FilterTabs as the listings
 * table) so it reads as part of the same product rather than a new one.
 *
 * Deliberately read-only: staff hold `document.view_all`, and the paperwork
 * stays the startup's to maintain.
 */
const FILTERS = ['All', 'Core missing', 'Complete']

export default function ComplianceOverview({ startups = [], total = 0, coreTotal = 0 }) {
  const [filter, setFilter] = useState(FILTERS[0])

  const visible = startups.filter((startup) => {
    if (filter === 'Core missing') return startup.coreUploaded < startup.coreTotal
    if (filter === 'Complete') return startup.uploaded === startup.total
    return true
  })

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SectionLabel className="lg:mt-0">
          {startups.length} startups · {coreTotal} core of {total} categories
        </SectionLabel>
        <FilterTabs
          label="Filter by document completeness"
          options={FILTERS}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:mt-[18px] lg:grid-cols-3 lg:gap-[18px]">
        {visible.map((startup) => (
          <Card key={startup.id} padding="lg" className="self-start">
            <Link href={startup.href} className="block">
              <div className="flex items-start justify-between gap-3">
                <Avatar
                  initials={startup.initial}
                  src={startup.logoUrl}
                  tone={startup.tone}
                  shape="square"
                  size="lg"
                  className="text-base"
                />
                <Chip tone={startup.statusTone}>{startup.statusLabel}</Chip>
              </div>
              <h2 className="mt-3.5 text-[17px] font-bold text-ink">{startup.name}</h2>
              <p className="mt-2 text-[13px] text-muted">
                {startup.uploaded} of {startup.total} uploaded · {startup.coreUploaded} of{' '}
                {startup.coreTotal} core
              </p>
              <p className="mt-1 text-[13px] text-muted">Last upload: {startup.lastUpload}</p>
            </Link>
          </Card>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card padding="lg" className="mt-3">
          <p className="text-[13px] text-muted">No startup matches this filter.</p>
        </Card>
      ) : null}
    </>
  )
}
