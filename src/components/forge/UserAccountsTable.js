'use client'

import { useMemo, useState } from 'react'
import { Avatar, Button, Card, Chip, DataTable, FilterTabs } from '@/components/ui'

/**
 * Reference: /reference/mast ui/FM/User Accounts.png       (search + spaced table)
 *            /reference/mast phone ui/FM/User Accounts.png (avatar cards)
 *
 * @param {string[]} [groups]  Restrict to certain role groups, for the
 *   All Students / All Founders / Role Assignments routes.
 */
export default function UserAccountsTable({
  groups,
  accounts: userAccounts = [],
  filters: userFilters = ['All'],
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const base = useMemo(
    () => (groups ? userAccounts.filter((user) => groups.includes(user.group)) : userAccounts),
    [groups, userAccounts]
  )

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return base
      .filter((user) => (filter === 'All' ? true : user.group === filter))
      .filter((user) =>
        term
          ? user.name.toLowerCase().includes(term) || user.appId.toLowerCase().includes(term)
          : true
      )
  }, [base, filter, query])

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'appId', label: 'App ID' },
    { key: 'role', label: 'Role' },
    { key: 'status', label: 'Status' },
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
    status: <Chip tone={user.tone2}>{user.status}</Chip>,
    actions: (
      <Button
        variant="subtle"
        size="sm"
        disabled
        title="Account management is a Backend Manager action"
        className="border-0 bg-primary-100 text-primary-text"
      >
        Manage
      </Button>
    ),
  }))

  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label htmlFor="user-search" className="sr-only">
          Search by name or App ID
        </label>
        <input
          id="user-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or App ID..."
          className="h-10 w-full rounded-field border border-line bg-surface px-3.5 text-sm text-ink placeholder:text-muted focus:border-primary-500 focus:outline-none lg:w-[286px]"
        />
        {groups ? null : (
          <FilterTabs
            label="Filter user accounts"
            options={userFilters}
            value={filter}
            onChange={setFilter}
          />
        )}
      </div>

      <div className="mt-5 hidden lg:block">
        <DataTable columns={columns} rows={rows} spaced caption="All platform users" />
      </div>

      <ul className="mt-4 space-y-3 lg:hidden">
        {visible.map((user) => (
          <li key={user.id}>
            <Card padding="lg" className="flex items-center gap-3.5">
              <Avatar initials={user.initials} tone={user.tone} shape="square" size="lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold text-ink">{user.short}</p>
                <p className="truncate text-[13px] text-muted">
                  {user.mobileRole ?? user.role}
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </>
  )
}
