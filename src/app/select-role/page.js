import { redirect } from 'next/navigation'
import { requireIdentityOrRedirect } from '@/lib/auth/guard'
import { landingPathFor } from '@/lib/auth/role-routing'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Signing you in',
  description: 'Taking you to your ATLAS Forge dashboard.',
  path: '/select-role',
  noIndex: true,
})

/**
 * Post-login redirect. There is no role picker any more: one user = one role,
 * so every signed-in user goes straight to their role's dashboard. Password
 * login, Google Sign-In and the change-password screen all land here.
 *
 * The usual guard runs first (anonymous → /login, forced password change →
 * /change-password). A user who holds no role at all is sent to /login. Every
 * dashboard still enforces its role server-side, so this redirect never grants
 * access on its own.
 */
export default async function SelectRolePage() {
  const identity = await requireIdentityOrRedirect('/select-role')
  redirect(landingPathFor(identity.roles) ?? '/login?error=no_role')
}
