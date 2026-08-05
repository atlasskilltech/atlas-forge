import Link from 'next/link'
import { BrandLogo, Button, PageTitle, Subtle } from '@/components/ui'

export const metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

/**
 * 404. Built only from existing design-system pieces so it carries the same
 * visual language as the rest of the platform.
 */
export default function NotFound() {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center"
    >
      <BrandLogo mark="forge" priority className="h-9" />
      <div className="space-y-2">
        <PageTitle>Page not found</PageTitle>
        <Subtle className="max-w-md">
          The page you&apos;re looking for doesn&apos;t exist, or you may not have access
          to it with your current role.
        </Subtle>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button as={Link} href="/select-role" size="lg">
          Choose a role
        </Button>
        <Button as={Link} href="/login" variant="secondary" size="lg">
          Back to sign in
        </Button>
      </div>
    </main>
  )
}
