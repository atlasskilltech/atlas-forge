'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'

/**
 * Signs the user out.
 *
 * The cookie is httpOnly, so only the server can clear it — navigating to
 * /login on its own would leave a valid session behind. A failed request still
 * navigates: the user asked to leave, and the next authenticated request would
 * be rejected anyway.
 *
 * `router.refresh()` drops the cached server-rendered payload so the previous
 * user's screens are not still sitting in the client router cache.
 */
export function useLogout() {
  const router = useRouter()

  return useCallback(async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      /* Already signed out, or offline — leave anyway. */
    }
    router.replace('/login')
    router.refresh()
  }, [router])
}
