import Link from 'next/link'
import RoleSelectCard from '@/components/auth/RoleSelectCard'
import { BrandLogo } from '@/components/ui'
import { ROLE_LIST } from '@/config/roles'
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Select your role',
  description: `Choose how you want to continue in ${siteConfig.name}.`,
  path: '/select-role',
  noIndex: true,
})

/** Reference: /reference/mast ui/Login/Role Select.png — left panel summary list. */
const ROLE_SUMMARY = [
  { icon: '🎓', title: 'Students', detail: 'Flag availability · Browse jobs & projects' },
  { icon: '🚀', title: 'Founders', detail: 'Manage startup · Post jobs · Find talent' },
  { icon: '🛠️', title: 'Forge Manager', detail: 'Oversee incubator · Approve content' },
  { icon: '⚙️', title: 'Backend Manager', detail: 'Platform settings · User management' },
  { icon: '👁️', title: 'Super Admin', detail: 'Read-only platform visibility' },
]

/**
 * Reference: /reference/mast ui/Login/Role Select.png       (1440x900, 480px dark panel)
 *            /reference/mast phone ui/Login/Role Select.png (390x844, 196px dark header)
 *
 * The greeting lives in the dark header on mobile and in the right column on
 * desktop, so it is authored twice and toggled — only ever one is in the
 * accessibility tree.
 */
export default function SelectRolePage() {
  return (
    <main
      id="main-content"
      className="min-h-dvh bg-canvas lg:grid lg:h-dvh lg:grid-cols-[480px_1fr] lg:overflow-hidden"
    >
      {/* ---- Dark panel / mobile header ---------------------------------- */}
      <section className="flex flex-col items-center bg-navy-900 px-6 pt-[29px] pb-[70px] text-center lg:h-full lg:items-start lg:overflow-hidden lg:px-[60px] lg:pt-[clamp(24px,8.889vh,80px)] lg:pb-[clamp(16px,4.444vh,40px)] lg:text-left">
        <BrandLogo mark="universityWhite" priority className="h-[35px] lg:hidden" />

        <div className="hidden items-center gap-3 lg:flex">
          <span
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-tile bg-[#393d4e] text-sm font-bold text-white"
          >
            AF
          </span>
          <span>
            <span className="block text-[17px] font-bold tracking-[0.01em] text-white">
              ATLAS FORGE
            </span>
            {/* Dark panel — `-fill` keeps the original, higher-contrast tone. */}
            <span className="block text-xs text-muted-fill">{siteConfig.tagline}</span>
          </span>
        </div>

        <h1 className="mt-2.5 text-[22px] leading-tight font-bold text-white lg:hidden">
          Welcome back 👋
        </h1>
        <p className="mt-[9px] text-[13px] leading-4 text-muted-fill lg:hidden">
          Select your role to continue
        </p>

        <p className="hidden text-sm leading-[18px] text-muted-fill lg:mt-[clamp(14px,4.444vh,40px)] lg:block">
          Connecting students, founders,
          <br />
          and mentors at {siteConfig.university}.
        </p>

        <hr className="hidden w-[360px] border-0 border-t border-[#343849] lg:mt-[clamp(14px,5.222vh,47px)] lg:block" />

        <ul className="hidden w-full lg:mt-[clamp(8px,2vh,18px)] lg:block lg:space-y-[clamp(8px,2.889vh,26px)]">
          {ROLE_SUMMARY.map((role) => (
            <li key={role.title} className="flex gap-[15px]">
              <span aria-hidden="true" className="w-5 shrink-0 text-base leading-6">
                {role.icon}
              </span>
              <span>
                <span className="block text-[15px] font-bold text-white">
                  {role.title}
                </span>
                <span className="mt-0.5 block text-xs text-muted-fill">{role.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Role picker ------------------------------------------------- */}
      <section className="px-4 pt-4 pb-10 lg:h-full lg:overflow-hidden lg:px-[100px] lg:pt-[clamp(24px,10.444vh,94px)] lg:pb-[clamp(16px,4.444vh,40px)]">
        <h1 className="hidden text-[30px] leading-tight font-bold tracking-[-0.01em] text-ink lg:block">
          Welcome back 👋
        </h1>
        <p className="hidden text-sm text-muted lg:mt-[clamp(4px,0.889vh,8px)] lg:block">
          You&apos;re signed in. Select your role to continue.
        </p>

        <ul className="space-y-4 lg:mt-[clamp(10px,3.222vh,29px)] lg:grid lg:max-w-[726px] lg:grid-cols-2 lg:gap-[clamp(8px,1.778vh,16px)] lg:space-y-0">
          {ROLE_LIST.map((role) => (
            <li key={role.id}>
              <RoleSelectCard role={role} />
            </li>
          ))}
        </ul>

        <Link
          href="/login"
          className="mt-7 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-text transition-colors hover:text-primary-700 lg:mt-[clamp(10px,3.111vh,28px)]"
        >
          <span aria-hidden="true">←</span>
          Sign in with a different account
        </Link>
      </section>
    </main>
  )
}
