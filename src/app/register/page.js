import Image from 'next/image'
import Link from 'next/link'
import { Roboto } from 'next/font/google'
import RegisterForm from '@/components/landing/RegisterForm'
import { buildMetadata } from '@/lib/seo'

/**
 * Public registration page — "Join the ATLAS Forge Network".
 *
 * Reference: /reference/form/Form · 1 Start (Common fields).png
 *
 * Like the landing page (`src/app/page.js`), this screen is set in Roboto to
 * match the reference frames. The `--font-roboto` variable is attached to the
 * wrapper below and nowhere else, so no signed-in screen changes typeface, and
 * the platform's Inter is untouched. next/font self-hosts the file, so the CSP
 * needs no new origin.
 *
 * A submission here will become a PENDING registration request that a Forge
 * Manager reviews before any account is created — wired up in later phases.
 */
const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

export const metadata = buildMetadata({
  title: 'Register',
  description:
    'Join the ATLAS Forge Network — register to connect with mentorship, incubation, collaboration and other opportunities at ATLAS Forge.',
  path: '/register',
})

export default function RegisterPage() {
  return (
    <div className={`${roboto.variable} min-h-dvh bg-forge-bg font-forge text-forge-ink`}>
      {/* ---- Top strip: a way back to the site (reference "Close") --------- */}
      <div className="bg-white">
        <div className="mx-auto flex h-[60px] w-full max-w-[980px] items-center justify-end px-6">
          <Link
            href="/"
            className="text-[18px] text-forge-purple transition-opacity hover:opacity-70"
          >
            Close
          </Link>
        </div>
      </div>

      {/* ---- Form shell --------------------------------------------------- */}
      <main id="main-content" className="mx-auto w-full max-w-[980px] px-6 pt-10 pb-20 lg:pt-12">
        <Image
          src="/assets/landing-page/images/atlas-forge-wordmark.png"
          alt="ATLAS Forge"
          width={250}
          height={70}
          priority
          className="h-[52px] w-auto lg:h-[62px]"
        />

        {/* The heading, intro and the post-submit success state all live in the
            form component so they swap together while the wordmark above stays. */}
        <RegisterForm />
      </main>
    </div>
  )
}
