'use client'

import { useState } from 'react'
import { api } from '@/lib/api/client'

/**
 * Backend Manager testing mode: switch the role the app treats you as.
 *
 * Calls POST /api/auth/act-as (the server checks that your REAL role is
 * Backend Manager) and then does a full page load of the new role's home, so
 * every server-rendered menu and permission is rebuilt for that role.
 *
 * @param {'banner'|'cards'} variant  `banner` = the strip shown while acting;
 *                                    `cards` = the Switch Role page.
 */
export default function ActAsSwitcher({ roles = [], current = null, variant = 'cards' }) {
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

  if (variant === 'banner') {
    const currentLabel = roles.find((role) => role.value === current)?.label ?? current
    return (
      <div
        role="status"
        className="mb-4 rounded-card border border-warning-fill bg-[#fff6db] px-4 py-3 text-[13px] text-ink lg:mb-5"
      >
        <p>
          <strong>Testing mode:</strong> you are acting as <strong>{currentLabel}</strong>. You
          see and can do exactly what a {currentLabel} can. Anything you do is real and is saved
          under your own account.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => switchTo('backend-manager')}
            className="rounded-control bg-ink px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
          >
            Back to Backend Manager
          </button>
          {roles
            .filter((role) => role.value !== current && role.value !== 'backend-manager')
            .map((role) => (
              <button
                key={role.value}
                type="button"
                disabled={Boolean(busy)}
                onClick={() => switchTo(role.value)}
                className="rounded-control border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink disabled:opacity-60"
              >
                Act as {role.label}
              </button>
            ))}
        </div>
        {error ? <p className="mt-2 text-danger-text">{error}</p> : null}
      </div>
    )
  }

  return (
    <div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {roles
          .filter((role) => role.value !== 'backend-manager')
          .map((role) => (
            <li key={role.value}>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => switchTo(role.value)}
                className="w-full rounded-card border border-line bg-surface px-5 py-4 text-left shadow-card transition hover:border-primary-500 disabled:opacity-60"
              >
                <span className="block text-[15px] font-bold text-ink">Act as {role.label}</span>
                <span className="mt-1 block text-[13px] text-muted">{role.description}</span>
                {busy === role.value ? <span className="mt-1 block text-xs text-muted">Switching…</span> : null}
              </button>
            </li>
          ))}
      </ul>
      {error ? (
        <p className="mt-3 text-[13px] text-danger-text" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
