'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Avatar, Button, Card, Chip, FilterTabs, SectionLabel } from '@/components/ui'
import { applicants, hiringTabs, listings, mobileListings } from '@/data/founder'
import { cn } from '@/lib/utils'

/**
 * Reference: /reference/mast ui/Founder/Hiring.png       (tabs + list + detail + applicants)
 *            /reference/mast phone ui/Founder/Hiring.png ("My Listings" cards)
 */
export default function HiringPanel() {
  const [tab, setTab] = useState(hiringTabs[0])
  const [selectedId, setSelectedId] = useState(listings[0].id)

  const selected = listings.find((listing) => listing.id === selectedId) ?? listings[0]

  return (
    <>
      <FilterTabs
        label="Hiring views"
        options={hiringTabs}
        value={tab}
        onChange={setTab}
        className="hidden lg:flex"
      />

      {/* ---- Desktop: listings + detail ---------------------------------- */}
      <div className="mt-[22px] hidden gap-[22px] lg:grid lg:grid-cols-[368px_1fr] lg:items-start">
        <ul className="space-y-4">
          {listings.map((listing) => {
            const active = listing.id === selected.id
            return (
              <li key={listing.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(listing.id)}
                  aria-current={active ? 'true' : undefined}
                  className={cn(
                    'w-full rounded-card border bg-surface p-5 text-left shadow-card transition-colors',
                    active ? 'border-primary-300' : 'border-line hover:border-primary-200'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-[15px] font-bold text-ink">{listing.title}</h2>
                    <Chip tone={listing.tone}>{listing.status}</Chip>
                  </div>
                  <p className="mt-1.5 text-[13px] text-muted">
                    {listing.company} · {listing.type}
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {listing.skills.map((skill) => (
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
          <h2 className="text-[22px] font-bold text-ink">{selected.title}</h2>
          <p className="mt-2.5 text-sm text-muted">{selected.detailMeta}</p>
          <p className="mt-3 max-w-[700px] text-sm leading-[22px] text-muted">
            {selected.description}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.detailSkills.map((skill) => (
              <Chip key={skill} tone="skill" size="lg">
                {skill}
              </Chip>
            ))}
          </div>

          <SectionLabel className="mt-6">Applicants ({applicants.length})</SectionLabel>
          <ul className="mt-3 space-y-2">
            {applicants.map((applicant) => (
              <li
                key={applicant.id}
                className="flex items-center gap-3.5 rounded-tile border border-line-soft px-3.5 py-3"
              >
                <Avatar
                  initials={applicant.initials}
                  tone={applicant.tone}
                  shape="square"
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-ink">{applicant.name}</p>
                  <p className="text-[13px] text-muted">{applicant.meta}</p>
                </div>
                <Button variant="subtle" size="md" className="border-0 bg-primary-100 text-primary-500">
                  View Profile
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* ---- Mobile: my listings ----------------------------------------- */}
      <ul className="space-y-3 lg:hidden">
        {mobileListings.map((listing) => (
          <li key={listing.id}>
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-bold text-ink">{listing.title}</h2>
                <Chip tone={listing.tone}>{listing.status}</Chip>
              </div>
              <p className="mt-3 text-[13px] text-muted">{listing.meta}</p>
            </Card>
          </li>
        ))}
      </ul>

      <Button as={Link} href="/founder/post-job" fullWidth className="mt-4 h-12 lg:hidden">
        + Post a Job
      </Button>
    </>
  )
}
