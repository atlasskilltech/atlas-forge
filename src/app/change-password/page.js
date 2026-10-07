import ChangePasswordForm from '@/components/auth/ChangePasswordForm'
import { BrandLogo } from '@/components/ui'
import { requireIdentityOrRedirect } from '@/lib/auth/guard'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Change your password',
  description: 'Set a new password for your ATLAS Forge account.',
  path: '/change-password',
  noIndex: true,
})

/**
 * The forced first-login password change.
 *
 * `allowPasswordChange: true` is what keeps the guard from bouncing a
 * must-change user away from the one screen they are allowed to be on. An
 * anonymous visitor is still redirected to login; a signed-in user whose flag
 * is already clear can still set a new password here.
 */
export default async function ChangePasswordPage() {
  const identity = await requireIdentityOrRedirect('/change-password', { allowPasswordChange: true })
  const mustChange = identity.user.mustChangePassword

  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10"
    >
      <div className="w-full max-w-[460px] rounded-card bg-surface p-6 shadow-card sm:p-8">
        <BrandLogo mark="forge" priority className="h-8" />

        <h1 className="mt-6 text-2xl font-bold text-ink">
          {mustChange ? 'Set your password' : 'Change your password'}
        </h1>
        <p className="mt-2 text-sm leading-[20px] text-muted">
          {mustChange
            ? `Welcome, ${identity.user.name}. For your security, choose a new password before you continue. Your temporary password will stop working once you do.`
            : 'Enter your current password and choose a new one.'}
        </p>

        <ChangePasswordForm />
      </div>
    </main>
  )
}
