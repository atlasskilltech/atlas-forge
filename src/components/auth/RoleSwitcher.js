'use client'

import { useState } from 'react'
import { api } from '@/lib/api/client'

/**
 * Backend Manager: switch to any of the five roles, or back to Backend
 * Manager. Calls POST /api/auth/act-as (the server checks that the REAL role
 * is Backend Manager) and then loads the new role's home page in full, so every
 * menu and permission is rebuilt for that role.
 */
export default function RoleSwitcher({ roles = [], current = null }) {
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)

  async function switchTo(slug) {
    setBusy(slug)
    setError(null)
    try {
      const { home } = await api.post('/api/auth/act-as', { role: slug })
      window.location.assign(home)
    } catch (caught) {
      setError(caught.message)
      setBusy(null)
    }
  }

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {roles.map((role) => {
          const isCurrent = role.value === current
          return (
            <li key={role.value}>
              <button
                type="button"
                disabled={Boolean(busy) || isCurrent}
                aria-current={isCurrent ? 'true' : undefined}
                onClick={() => switchTo(role.value)}
                className={
                  isCurrent
                    ? 'w-full rounded-card border-2 border-primary-500 bg-surface px-5 py-4 text-left shadow-card'
                    : 'w-full rounded-card border border-line bg-surface px-5 py-4 text-left shadow-card transition hover:border-primary-500 disabled:opacity-60'
                }
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-bold text-ink">{role.label}</span>
                  {isCurrent ? (
                    <span className="rounded-control bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-text">
                      Current
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 block text-[13px] text-muted">{role.description}</span>
                {busy === role.value ? <span className="mt-1 block text-xs text-muted">Switching…</span> : null}
              </button>
            </li>
          )
        })}
      </ul>
      {error ? (
        <p className="mt-3 text-[13px] text-danger-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
