'use client'

import { useMemo, useState } from 'react'
import { Avatar, Card, Chip, DataTable, FilterTabs } from '@/components/ui'
import { userFilters, users } from '@/data/admin'

/**
 * Reference: /reference/mast ui/SA/All Users.png       (6 columns, no Actions)
 *            /reference/mast phone ui/SA/All Users.png (avatar cards)
 *
 * The Actions column present in the Forge/Backend tables is absent here — this
 * role has no operations available.
 */
const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'appId', label: 'App ID' },
  { key: 'role', label: 'Role' },
  { key: 'startup', label: 'Startup' },
  { key: 'status', label: 'Status' },
  { key: 'lastActive', label: 'Last Active' },
]

export default function UsersView() {
  const [filter, setFilter] = useState('All')

  const visible = useMemo(
    () => (filter === 'All' ? users : users.filter((user) => user.group === filter)),
    [filter]
  )

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
  }))

  return (
    <>
      <FilterTabs
        label="Filter users"
        options={userFilters}
        value={filter}
        onChange={setFilter}
        className="hidden lg:flex"
      />

      <div className="mt-4 hidden lg:block">
        <DataTable columns={COLUMNS} rows={rows} caption="All platform accounts — view only" />
      </div>

      <ul className="space-y-3 lg:hidden">
        {users.slice(0, 5).map((user) => (
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
