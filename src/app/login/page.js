import LoginForm from '@/components/auth/LoginForm'
import { BrandLogo, Chip } from '@/components/ui'
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Sign in',
  description: `Sign in to ${siteConfig.name} with your ATLAS SkillTech University App ID.`,
  path: '/login',
})

/** Reference: /reference/mast ui/Login Screen.png — left dark panel value props. */
const HIGHLIGHTS = [
  { icon: '🔍', label: 'Find talent through Service' },
  { icon: '💼', label: 'Post jobs and build your team' },
  { icon: '🤝', label: 'Connect with mentors' },
  { icon: '🚀', label: 'Apply for ATLAS Forge incubation' },
]

/**
 * Role chips beneath the form. Note these tones are specific to the login
 * screen and deliberately differ from the role-select tints — both are
 * reproduced exactly as drawn in their respective references.
 */
const ACCESS_CHIPS = [
  { label: 'Standard Student', tone: 'neutral' },
  { label: 'Founder', tone: 'info' },
  { label: 'Forge Manager', tone: 'success' },
  { label: 'Backend Manager', tone: 'warning' },
]

/**
 * Reference: /reference/mast ui/Login Screen.png        (1440x900, 680px dark panel)
 *            /reference/mast phone ui/Login Screen.png  (390x844, full-bleed dark)
 *
 * One DOM tree drives both layouts so the form is never duplicated: the brand
 * panel is a centred header on mobile and the left column on desktop.
 */
export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="min-h-dvh bg-navy-900 lg:grid lg:grid-cols-[680px_1fr]"
    >
      {/* ---- Brand panel ------------------------------------------------- */}
      <section className="flex flex-col items-center px-6 pt-[61px] text-center lg:items-start lg:justify-center lg:px-20 lg:pt-0 lg:text-left">
        <div className="flex items-center gap-[33px]">
          {/* White-alpha variant on both breakpoints — the panel is #1E2235. */}
          <BrandLogo mark="universityWhite" priority className="h-[42px] lg:h-[84px]" />
          <BrandLogo mark="forge" priority className="hidden h-16 lg:block" />
        </div>

        {/* Mobile-only lockup */}
        <h1 className="mt-[13px] text-[22px] leading-tight font-bold tracking-[0.01em] text-white lg:hidden">
          ATLAS FORGE
        </h1>
        {/* On the navy panel — `-fill` is the original, higher-contrast tone here. */}
        <p className="mt-[5px] text-[13px] leading-[15px] text-muted-fill lg:hidden">
          {siteConfig.tagline}
          <br />
          {siteConfig.university}
        </p>

        {/* Desktop-only supporting copy */}
        <p className="mt-[31px] hidden max-w-[465px] text-sm leading-[18px] text-muted-fill lg:block">
          The Product Development Centre for ATLAS SkillTech University -
          connecting students, founders, and mentors.
        </p>

        <ul className="mt-[27px] hidden space-y-[13px] lg:block">
          {HIGHLIGHTS.map((item) => (
            <li key={item.label}>
              <span className="inline-flex h-[37px] items-center gap-2.5 rounded-control bg-[#2b3047] px-3.5 text-sm text-navy-item-active">
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ---- Form panel -------------------------------------------------- */}
      <section className="flex px-4 pb-10 lg:min-h-dvh lg:items-center lg:justify-center lg:bg-surface lg:px-[100px] lg:pb-0">
        <div className="mt-[83px] w-full rounded-card bg-surface px-6 py-7 lg:mt-0 lg:max-w-[560px] lg:rounded-none lg:p-0">
          <BrandLogo mark="forge" priority className="h-8 lg:hidden" />

          <h1 className="mt-3.5 text-2xl leading-tight font-bold tracking-[-0.01em] text-ink lg:mt-0 lg:text-[30px]">
            <span className="lg:hidden">Sign in</span>
            <span className="hidden lg:inline">Sign in to {siteConfig.name}</span>
          </h1>

          <p className="hidden text-sm text-muted lg:mt-[18px] lg:block">
            Use your Student App ID and password to log in.
          </p>

          <LoginForm />

          <p className="mt-3.5 text-[13px] leading-[15px] text-muted lg:mt-[23px] lg:max-w-[551px] lg:leading-[17px]">
            <span className="lg:hidden">Can&apos;t sign in? Contact Mihir Pawar</span>
            <span className="hidden lg:inline">
              First time? Your App ID was sent to your registered ATLAS email.
              Contact Mihir Pawar for account issues.
            </span>
          </p>

          <div className="hidden lg:mt-[22px] lg:block">
            <p className="text-[13px] font-semibold text-ink">
              Access is determined by your role after login
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ACCESS_CHIPS.map((chip) => (
                <Chip key={chip.label} tone={chip.tone} size="lg">
                  {chip.label}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
