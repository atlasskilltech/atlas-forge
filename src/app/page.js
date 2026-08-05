import { redirect } from 'next/navigation'

/**
 * The platform has no public marketing page — the root is the sign-in entry
 * point. Kept as a redirect so `/` stays a valid, indexable canonical URL.
 */
export default function HomePage() {
  redirect('/login')
}
