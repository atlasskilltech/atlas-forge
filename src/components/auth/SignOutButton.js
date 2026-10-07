'use client'

import { useLogout } from '@/hooks/useLogout'

/** Clears the session and returns to the login screen. */
export default function SignOutButton({ className }) {
  const logout = useLogout()
  return (
    <button
      type="button"
      onClick={logout}
      className={
        className ??
        'inline-flex h-11 items-center rounded-control bg-primary-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-text'
      }
    >
      Sign out
    </button>
  )
}
