import { redirect } from 'next/navigation'

/**
 * The Backend Manager bottom nav has no "More" slot — its fifth item is
 * Platform Settings. Anything landing here goes to the dashboard.
 */
export default function BackendMorePage() {
  redirect('/backend/dashboard')
}
