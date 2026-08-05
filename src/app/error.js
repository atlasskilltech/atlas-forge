'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { BrandLogo, Button, PageTitle, Subtle } from '@/components/ui'

/**
 * Route-level error boundary. Catches render errors below the root layout so a
 * single broken screen never blanks the whole app.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    // Surfaces in the browser console during development and in whatever
    // reporter is wired up in production.
    console.error(error)
  }, [error])

  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center"
    >
      <BrandLogo mark="forge" priority className="h-9" />
      <div className="space-y-2">
        <PageTitle>Something went wrong</PageTitle>
        <Subtle className="max-w-md">
          This screen failed to load. Try again — if it keeps happening, contact the
          Forge Manager.
        </Subtle>
        {error?.digest ? (
          <p className="text-xs text-muted/70">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset} size="lg">
          Try again
        </Button>
        <Button as={Link} href="/select-role" variant="secondary" size="lg">
          Choose a role
        </Button>
      </div>
    </main>
  )
}
