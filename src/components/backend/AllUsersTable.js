'use client'

import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Chip, DataTable, FilterTabs } from '@/components/ui'
import { allUsers, userFilters } from '@/data/backend'

/**
 * Reference: /reference/mast ui/BM/All Users.png       (7 columns incl. Startup / Last Active)
 *            /reference/mast phone ui/BM/All Users.png (avatar cards)
 */
export default function AllUsersTable() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return allUsers
      .filter((user) => {
        if (filter === 'All') return true
        if (filter === 'Inactive') return user.status === 'Inactive'
        return user.group === filter
      })
      .filter((user) =>
        term
          ? user.name.toLowerCase().includes(term) || user.appId.toLowerCase().includes(term)
          : true
      )
  }, [filter, query])

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'appId', label: 'App ID' },
    { key: 'role', label: 'Role' },
    { key: 'startup', label: 'Startup' },
    { key: 'status', label: 'Status' },
    { key: 'lastActive', label: 'Last Active' },
    { key: 'actions', label: 'Actions' },
  ]

  const rows = visible.map((user) => ({
    id: user.id,
    name: (
      <span className="flex items-center gap-3.5">
        <Avatar initials={user.initials} tone={user.tone} shape="square" size="sm" />
        {user.name}
      </span>
    ),
    appId: user.appId,
    role: <span className="text-primary-text">{user.role}</span>,
    startup: user.startup,
    status: <Chip tone={user.statusTone}>{user.status}</Chip>,
    lastActive: user.lastActive,
    actions: (
      <Button variant="subtle" size="sm" className="border-0 bg-primary-100 text-primary-text">
        Manage
      </Button>
    ),
  }))

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label htmlFor="bm-user-search" className="sr-only">
          Search by name or App ID
        </label>
        <input
          id="bm-user-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or App ID..."
          className="h-11 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted focus:border-primary-500 focus:outline-none lg:w-[306px]"
        />
        <FilterTabs
          label="Filter users"
          options={userFilters}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="mt-5 hidden lg:block">
        <DataTable columns={columns} rows={rows} caption="All platform accounts" />
      </div>

      <ul className="mt-4 space-y-3 lg:hidden">
        {visible.map((user) => (
          <li key={user.id}>
            <Card padding="lg" className="flex items-center gap-3.5">
              <Avatar initials={user.initials} tone={user.tone} shape="square" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{user.name}</p>
                <p className="truncate text-[13px] text-muted">{user.role}</p>
              </div>
              <Chip tone={user.statusTone}>{user.status}</Chip>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
