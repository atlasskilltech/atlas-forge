import Link from 'next/link'
import SignOutButton from '@/components/auth/SignOutButton'
import { BrandLogo } from '@/components/ui'
import { requireRoleOrRedirect } from '@/lib/auth/guard'
import { ROLES } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'ATLAS Forge Network',
  description: 'Your ATLAS Forge network member home.',
  path: '/member/home',
  noIndex: true,
})

/**
 * Minimal network-member landing.
 *
 * Gated by the `network-member` role alone (the role carries no platform
 * permissions). Reaching it already means the forced password change is done —
 * `requireRoleOrRedirect` runs the forced-change check first and would have
 * sent an un-reset account to `/change-password`.
 *
 * A fuller member experience is a later phase; this confirms the account is
 * active and gives a way to sign out.
 */
export default async function MemberHomePage() {
  const identity = await requireRoleOrRedirect(ROLES.NETWORK_MEMBER, '/member/home')

  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10"
    >
      <div className="w-full max-w-[560px] rounded-card bg-surface p-6 shadow-card sm:p-8">
        <BrandLogo mark="forge" priority className="h-8" />

        <h1 className="mt-6 text-2xl font-bold text-ink">
          Welcome to the ATLAS Forge network, {identity.user.name.split(' ')[0]}.
        </h1>
        <p className="mt-2 text-sm leading-[21px] text-muted">
          Your account is active. Your App ID is{' '}
          <span className="font-semibold text-ink">{identity.user.appId}</span>. The ATLAS Forge
          team will be in touch with opportunities for mentorship, incubation and collaboration.
          More of the member experience is on its way.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/change-password"
            className="inline-flex h-11 items-center rounded-control border border-line px-5 text-sm font-medium text-ink transition-colors hover:bg-canvas"
          >
            Change password
          </Link>
          <SignOutButton />
        </div>
      </div>
    </main>
  )
}
