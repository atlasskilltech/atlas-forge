import { PageSkeleton } from '@/components/ui/Skeleton'

/**
 * Root loading boundary. Screens are statically rendered today, so this mostly
 * covers slow client transitions — it becomes load-bearing once the API section
 * introduces server data fetching.
 */
export default function Loading() {
  return (
    <div className="min-h-dvh bg-canvas px-4 pt-6 pb-8 lg:px-8 lg:pt-7">
      <PageSkeleton />
    </div>
  )
}
