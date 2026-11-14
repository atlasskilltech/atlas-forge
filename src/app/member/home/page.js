import { redirect } from 'next/navigation'
import { requireIdentityOrRedirect } from '@/lib/auth/guard'
import { landingPathFor } from '@/lib/auth/role-routing'

/**
 * The old Network Member home. The role no longer exists (approved
 * registrations are Job Seekers), so this URL only forwards stale bookmarks
 * and old approval-email links to the user's real dashboard.
 */
export default async function MemberHomePage() {
  const identity = await requireIdentityOrRedirect('/member/home')
  redirect(landingPathFor(identity.roles) ?? '/login?error=no_role')
}
