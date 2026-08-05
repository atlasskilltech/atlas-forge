'use client'

import { useEffect } from 'react'

/**
 * Last-resort boundary for failures in the root layout itself. It replaces
 * <html>/<body>, so it cannot rely on the app's fonts or design tokens and
 * carries the few styles it needs inline.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en-IN">
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          padding: '24px',
          textAlign: 'center',
          background: '#f7f8fc',
          color: '#1a1d2e',
          fontFamily: 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif',
        }}
      >
        <h1 style={{ fontSize: '26px', fontWeight: 700, margin: 0 }}>
          ATLAS Forge is unavailable
        </h1>
        <p style={{ margin: 0, fontSize: '14px', color: '#9097b8', maxWidth: '28rem' }}>
          The application failed to start. Please refresh, or contact the Forge Manager
          if the problem continues.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            height: '38px',
            padding: '0 18px',
            borderRadius: '8px',
            border: 0,
            background: '#7c6ff7',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
