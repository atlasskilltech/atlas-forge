'use client'

import Link from 'next/link'
import { Button, Card } from '@/components/ui'

/**
 * Reference: /reference/mast phone ui/Founder/Incubation Apply.png — a saved
 * draft card with Continue / Preview, plus a "Start New Application" action.
 *
 * On desktop the equivalent frame is the full Startup Profile form, which lives
 * at /founder/incubation; this summary links into it.
 */
export default function IncubationStatus({ draft }) {
  return (
    <>
      {draft ? (
      <Card padding="lg">
        <p className="text-[15px] font-bold text-ink">{draft.title}</p>
        <p className="mt-1 text-[13px] text-muted">{draft.meta}</p>
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <Button as={Link} href="/founder/incubation" size="lg">
            Continue
          </Button>
          <Button variant="secondary" size="lg" disabled title="No detail screen exists yet">
            Preview
          </Button>
        </div>
      </Card>
      ) : null}

      <Button
        as={Link}
        href="/founder/incubation"
        variant="subtle"
        fullWidth
        className="mt-4 h-12"
      >
        Start New Application
      </Button>
    </>
  )
}
