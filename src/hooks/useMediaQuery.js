'use client'

import { useEffect, useState } from 'react'

/**
 * Subscribe to a CSS media query from JS.
 *
 * Always returns `false` on the server and for the first client render so the
 * markup matches during hydration, then resolves to the real value.
 *
 * Use this when a breakpoint must change *content* (e.g. a placeholder string)
 * rather than styling. For anything purely visual, prefer Tailwind's responsive
 * utilities — duplicating a form control per breakpoint puts a hidden `required`
 * field in the DOM, which silently blocks submission because the browser cannot
 * focus it to report the error.
 */
export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const list = window.matchMedia(query)
    const update = () => setMatches(list.matches)
    update()
    list.addEventListener('change', update)
    return () => list.removeEventListener('change', update)
  }, [query])

  return matches
}

/** The `lg` breakpoint — where the app switches to desktop chrome. */
export function useIsDesktop() {
  return useMediaQuery('(min-width: 1024px)')
}
