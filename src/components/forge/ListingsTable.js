'use client'

import { useMemo, useState } from 'react'
import { Button, Card, Chip, DataTable, FilterTabs } from '@/components/ui'
import { allListings, listingFilters } from '@/data/forge'

/**
 * Reference: /reference/mast ui/FM/All Listings.png — 7-column table with a
 * per-row View action. No mobile frame exists, so below `lg` the same rows
 * render as cards using the established card pattern.
 */
export default function ListingsTable() {
  const [filter, setFilter] = useState('All')

  const visible = useMemo(() => {
    if (filter === 'All') return allListings
    if (filter === 'Pending Approval') {
      return allListings.filter((row) => row.status === 'Pending')
    }
    if (filter === 'Job Listing') {
      return allListings.filter((row) => row.type !== 'Collab')
    }
    if (filter === 'Collab Post') {
      return allListings.filter((row) => row.type === 'Collab')
    }
    return allListings.filter((row) => row.status === filter)
  }, [filter])

  const columns = [
    { key: 'title', label: 'Title' },
    { key: 'startup', label: 'Startup' },
    { key: 'type', label: 'Type' },
    { key: 'by', label: 'Posted by' },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ]

  const rows = visible.map((row) => ({
    id: row.id,
    title: row.title,
    startup: row.startup,
    type: row.type,
    by: <span className="text-primary-text">{row.by}</span>,
    date: row.date,
    status: <Chip tone={row.tone}>{row.status}</Chip>,
    actions: (
      <Button variant="subtle" size="sm" className="border-0 bg-primary-100 text-primary-text">
        View
      </Button>
    ),
  }))

  return (
    <>
      <FilterTabs
        label="Filter listings"
        options={listingFilters}
        value={filter}
        onChange={setFilter}
      />

      <div className="mt-4 hidden lg:block">
        <DataTable columns={columns} rows={rows} caption="All job and collab listings" />
      </div>

      <ul className="mt-4 space-y-3 lg:hidden">
        {visible.map((row) => (
          <li key={row.id}>
            <Card padding="lg">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[15px] font-bold text-ink">{row.title}</h2>
                <Chip tone={row.tone}>{row.status}</Chip>
              </div>
              <p className="mt-2.5 text-[13px] text-muted">
                {row.startup} · {row.type} · {row.date}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
