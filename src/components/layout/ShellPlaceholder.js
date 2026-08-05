import { Card, PageTitle, Subtle } from '@/components/ui'

/**
 * Temporary body used by the role routes while the layout shell is being
 * verified. Each of these screens is replaced by its real content in the
 * per-role sections that follow.
 */
export default function ShellPlaceholder({ title, note }) {
  return (
    <div className="space-y-4">
      <PageTitle>{title}</PageTitle>
      <Card padding="lg">
        <Subtle>{note}</Subtle>
      </Card>
    </div>
  )
}
