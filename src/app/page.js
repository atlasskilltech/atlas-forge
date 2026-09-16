import Image from 'next/image'
import Link from 'next/link'
import { Roboto } from 'next/font/google'
import EnquiryButton from '@/components/landing/EnquiryButton'
import EnquiryProvider from '@/components/landing/EnquiryProvider'
import FaqSection from '@/components/landing/FaqSection'
import InfrastructureSection from '@/components/landing/InfrastructureSection'
import LandingHeader from '@/components/landing/LandingHeader'
import StoryVideo from '@/components/landing/StoryVideo'
import {
  ABOUT_STATS,
  BRIDGE_STATS,
  CONCIERGE,
  EXCLUSIVE_STATS,
  JOURNEY,
  MANUFACTURING,
  SCHOOLS,
  STARTUP_GROUPS,
  TEAM,
  WHY_JOIN,
} from '@/components/landing/landing-content'
import { siteConfig } from '@/config/site'
import { buildMetadata } from '@/lib/seo'

/**
 * The landing page is set in Roboto, which is what the reference frames are
 * drawn in. The platform's Inter is untouched: this variable is attached to
 * the landing wrapper below and to nothing else, so no signed-in screen
 * changes typeface, and next/font self-hosts the file so the CSP needs no
 * new origin.
 */
const roboto = Roboto({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
  weight: ['400', '500', '700'],
})

export const metadata = buildMetadata({
  title: 'From sketch to shelf',
  description:
    'ATLAS Forge is a university-led incubation model in Mumbai. Founders get the people, facilities and practical support needed to move from an idea to a product.',
  path: '/',
})

/* -------------------------------------------------------------------------- */
/* Small shared pieces                                                        */
/* -------------------------------------------------------------------------- */

/** The wide-tracked violet caption above every section heading. */
function Eyebrow({ children, className = '', tone = 'text-forge-purple' }) {
  return (
    <p
      className={`text-[11px] leading-[1.7] font-medium tracking-[0.28em] uppercase ${tone} ${className}`}
    >
      {children}
    </p>
  )
}

/** A "value + two-line label" pair. `\n` in the label is a hard break. */
function Stat({ value, label, valueClass, labelClass }) {
  return (
    <div className="flex items-start gap-3">
      <span className={valueClass}>
        {value.split('\n').map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
      <span className={labelClass}>
        {label.split('\n').map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function LandingPage() {
  return (
    <EnquiryProvider>
      <div className={`${roboto.variable} bg-forge-bg font-forge text-forge-ink`}>
        <LandingHeader />

        <main id="main-content">
          {/* ================= Hero ==================================== */}
          <section className="relative">
            <div className="relative h-[420px] w-full overflow-hidden sm:h-[500px] lg:h-[560px]">
              {/*
                The facility walkthrough supplied with the reference. Muted and
                silent by design — it is wallpaper behind the headline, so it
                autoplays, loops and never asks for sound. The poster is the
                clip's own first frame, so the hero is painted before a single
                byte of video arrives.

                Every MP4 on this page is served from
                https://atlasskilltech.app/atlas-forge-assets/ rather than
                `public/` — see the `media-src` note in next.config.mjs.
                Posters and all other images remain local to this origin.
              */}
              <video
                src="https://atlasskilltech.app/atlas-forge-assets/hero-facility.mp4"
                poster="/assets/landing-page/images/hero-facility-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0 size-full object-cover"
              />
              <div aria-hidden="true" className="absolute inset-0 bg-black/22" />

              <div className="relative mx-auto flex h-full w-full max-w-[1400px] flex-col justify-end px-6 pb-12 lg:px-10 lg:pb-14">
                <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
                  <h1 className="text-[56px] leading-[1.06] font-bold tracking-[-0.025em] text-white sm:text-[76px] lg:text-[92px]">
                    From sketch
                    <br />
                    to shelf.
                  </h1>

                  <a
                    href="#infrastructure"
                    className="inline-flex h-[46px] w-fit items-center justify-center rounded-[7px] border border-white/70 px-7 text-[15px] text-white backdrop-blur-[2px] transition-colors hover:bg-white/15 lg:mb-4"
                  >
                    Explore Facilities
                  </a>
                </div>
              </div>
            </div>

            {/* ---- Pink strip ---------------------------------------- */}
            <div className="bg-forge-pink">
              <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between lg:px-10 lg:py-9">
                <p className="text-[17px] leading-[24px] font-bold text-white lg:text-[19px] lg:leading-[26px]">
                  We connect enterprises with top startups,
                  <br className="hidden sm:block" /> disruptive tech and real growth
                  opportunities.
                </p>

                <EnquiryButton
                  sheet="service"
                  className="inline-flex h-[44px] w-fit shrink-0 items-center justify-center rounded-[7px] bg-white px-7 text-[15px] font-bold text-forge-ink transition-colors hover:bg-white/90"
                >
                  Questions? Lets Talk
                </EnquiryButton>
              </div>
            </div>
          </section>

          {/* ================= About the programme ===================== */}
          <section id="about" className="bg-forge-bg py-20 lg:py-28">
            <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)_260px] lg:gap-10">
                <Eyebrow className="pt-3">
                  About
                  <br className="hidden lg:block" /> The
                  <br className="hidden lg:block" /> Programme
                </Eyebrow>

                <h2 className="text-[54px] leading-[0.96] font-bold tracking-[-0.025em] sm:text-[72px] lg:text-[86px]">
                  A<br />
                  University-Led
                  <br />
                  <span className="text-forge-pink">
                    Incubation
                    <br />
                    Model.
                  </span>
                </h2>

                <p className="text-[13px] leading-[19px] text-[#55546c] lg:pt-3">
                  Atlas Forge is a design-led incubation programme that equips early-stage founders
                  with the tools, mentors, and community to build products people genuinely love.
                </p>
              </div>

              <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 lg:mt-20 lg:grid-cols-4 lg:gap-x-10 lg:pl-[220px]">
                {ABOUT_STATS.map((stat, index) => (
                  <Stat
                    key={`${stat.value}-${index}`}
                    value={stat.value}
                    label={stat.label}
                    valueClass="text-[34px] leading-[1.08] font-bold tracking-[-0.02em] text-forge-pink lg:text-[42px]"
                    labelClass="pt-1.5 text-[14px] leading-[19px] text-forge-ink lg:text-[15px]"
                  />
                ))}
              </dl>
            </div>
          </section>

          {/* ================= Exclusive access (violet) =============== */}
          <section className="bg-forge-purple py-20 lg:py-28">
            <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)_260px] lg:gap-10">
                <Eyebrow tone="text-white" className="pt-3">
                  Since 2025
                </Eyebrow>

                <h2 className="text-[54px] leading-[0.96] font-bold tracking-[-0.025em] text-forge-ink-deep sm:text-[72px] lg:text-[86px]">
                  An
                  <br />
                  Exclusive
                  <br />
                  Access
                  <br />
                  <span className="text-forge-pink">Incubation lab</span>
                </h2>

                <p className="text-[13px] leading-[19px] text-white/90 lg:pt-3">
                  ATLAS Forge is a university-led incubation model in Mumbai. Founders get the
                  people, facilities and practical support needed to move from an idea to a product.
                </p>
              </div>

              <dl className="mt-16 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3 lg:mt-24 lg:gap-x-10 lg:pl-[220px]">
                {EXCLUSIVE_STATS.map((stat) => (
                  <Stat
                    key={stat.value}
                    value={stat.value}
                    label={stat.label}
                    valueClass="text-[40px] leading-none font-bold tracking-[-0.02em] text-white lg:text-[48px]"
                    labelClass="pt-1 text-[15px] leading-[21px] text-white/75 lg:text-[16px]"
                  />
                ))}
              </dl>
            </div>
          </section>

          {/* ================= How to join + why join ================== */}
          <section className="relative overflow-hidden bg-forge-bg py-20 lg:py-24">
            <Blob className="-left-[190px] top-[60px] hidden lg:block" />

            <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <div className="rounded-[18px] bg-white/70 px-6 py-14 backdrop-blur-[2px] sm:px-10 lg:px-16 lg:py-20">
                <Eyebrow>The Process</Eyebrow>

                <h2 className="mt-7 text-[30px] leading-[1.14] font-bold tracking-[-0.02em] lg:text-[34px]">
                  How to Join Forge
                </h2>

                <p className="mt-8 max-w-[760px] text-[13.5px] leading-[21px] text-[#4b4a63]">
                  Apply through the ATLAS Forge Incubation Application. Our team reviews
                  applications and generally responds with a decision or next step within one week.
                  Selected applicants may be invited for a conversation, review or pitch before
                  final onboarding. No complicated process. Just show us what you&rsquo;re building.
                </p>

                <Link
                  href="/login"
                  className="mt-8 inline-flex h-[44px] items-center justify-center rounded-[7px] bg-forge-ink px-7 text-[15px] font-medium text-white transition-colors hover:bg-forge-purple"
                >
                  Join Us
                </Link>

                {/* ---- Why join ---------------------------------------- */}
                <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-16">
                  <Image
                    src="/assets/landing-page/images/why-join-forge.png"
                    alt="Founders reviewing a prototype at ATLAS Forge"
                    width={693}
                    height={602}
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="h-auto w-full rounded-[10px] object-cover"
                  />

                  <div className="flex flex-col">
                    <h3 className="text-[30px] leading-[1.14] font-bold tracking-[-0.02em] lg:text-[34px]">
                      Why should you join
                      <br />
                      Forge?
                    </h3>

                    <div className="mt-auto flex flex-col gap-7 pt-12">
                      {WHY_JOIN.map((item) => (
                        <div key={item.title}>
                          <h4 className="text-[13.5px] leading-[19px] font-bold">{item.title}</h4>
                          {item.body.split('\n').map((line) => (
                            <p
                              key={line}
                              className="mt-1 text-[13.5px] leading-[19px] text-[#4b4a63]"
                            >
                              {line}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= Infrastructure ========================== */}
          <InfrastructureSection />

          {/* ================= Bridge collage ========================== */}
          <section className="bg-forge-bg" aria-labelledby="bridge-heading">
            <div className="relative">
              {/* The offset blocks the reference layers behind the statistics
                  strip. Decorative, and only where there is room for them. */}
              <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-[92px] bg-forge-blue lg:block" />
              <div aria-hidden="true" className="absolute top-0 left-[92px] hidden h-[128px] w-[128px] bg-forge-purple-soft lg:block" />

              <div className="relative lg:pl-[92px]">
                {/* Pagination dots, drawn as in the reference. */}
                <div aria-hidden="true" className="flex items-center justify-end gap-2 px-6 py-8 lg:px-10">
                  <span className="h-[7px] w-[58px] rounded-full bg-forge-ink" />
                  <span className="size-[9px] rounded-full bg-[#bdbdbd]" />
                </div>

                <dl className="grid grid-cols-2 gap-x-6 gap-y-9 bg-forge-purple px-6 py-11 lg:grid-cols-4 lg:gap-x-10 lg:px-14 lg:py-14">
                  {BRIDGE_STATS.map((stat) => (
                    <div key={stat.value}>
                      <dt className="sr-only">{stat.label.replace('\n', ' ')}</dt>
                      <dd>
                        <span className="block text-[38px] leading-none font-bold tracking-[0.02em] text-white lg:text-[46px]">
                          {stat.value}
                        </span>
                        <span className="mt-3 block text-[13px] leading-[18px] text-white/72 lg:text-[14px]">
                          {stat.label.split('\n').map((line) => (
                            <span key={line} className="block">
                              {line}
                            </span>
                          ))}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* The team clip, then the blue band that overlaps it. */}
                <div className="relative">
                  <video
                    src="https://atlasskilltech.app/atlas-forge-assets/atlas-bridge-team.mp4"
                    poster="/assets/landing-page/images/atlas-bridge-team-poster.jpg"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    aria-hidden="true"
                    tabIndex={-1}
                    className="h-[240px] w-full object-cover sm:h-[340px] lg:h-[430px]"
                  />

                  <div className="bg-forge-blue lg:[clip-path:polygon(0_0,100%_0,calc(100%-96px)_100%,0_100%)]">
                    <div className="flex flex-col gap-6 px-6 py-9 sm:flex-row sm:items-center sm:justify-between lg:px-14 lg:py-11 lg:pr-[160px]">
                      <h2
                        id="bridge-heading"
                        className="text-[22px] leading-[1.28] font-bold text-white lg:text-[26px]"
                      >
                        From Idea to Growth,
                        <br />
                        Supported Every Step of the Way.
                      </h2>

                      <Link
                        href="/login"
                        className="inline-flex h-[40px] w-fit shrink-0 items-center justify-center rounded-[6px] bg-forge-ink px-6 text-[14px] font-medium text-white transition-colors hover:bg-forge-purple"
                      >
                        Apply For Atlas Incubation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ================= Multidisciplinary support =============== */}
          <section className="bg-forge-bg py-20 lg:py-28">
            <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <Eyebrow>Atlas Bridge</Eyebrow>

              <h2 className="mt-7 text-[30px] leading-[1.16] font-bold tracking-[-0.02em] lg:text-[34px]">
                Multidisciplinary
                <br />
                Support.
              </h2>

              <ul className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
                {SCHOOLS.map((school) => (
                  <li
                    key={school.name}
                    className="rounded-[10px] px-7 py-7"
                    style={{ backgroundColor: school.card }}
                  >
                    <div
                      className="flex h-[58px] w-full max-w-[174px] items-center justify-center rounded-[5px] px-5"
                      style={{ backgroundColor: school.plate }}
                    >
                      <Image
                        src={school.logo}
                        alt={school.alt}
                        width={school.width}
                        height={school.height}
                        className="h-[26px] w-auto"
                      />
                    </div>

                    <h3 className="mt-7 text-[14px] leading-none font-bold">{school.name}</h3>
                    <p className="mt-4 text-[12.5px] leading-[17px] text-[#55546c]">
                      {school.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ================= One journey ============================= */}
          <section className="bg-forge-bg pb-20 lg:pb-28">
            <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,470px)] lg:gap-16 lg:px-10">
              <div>
                <Eyebrow>From Idea to Market</Eyebrow>

                <h2 className="mt-7 text-[30px] leading-[1.16] font-bold tracking-[-0.02em] lg:text-[34px]">
                  One Journey.
                  <br />
                  One Clear Path.
                </h2>

                <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:mt-16">
                  {JOURNEY.map((step) => (
                    <div key={step.title}>
                      <h3 className="text-[19px] leading-none font-bold">{step.title}</h3>
                      <p className="mt-4 max-w-[230px] text-[12.5px] leading-[17px] text-[#55546c]">
                        {step.body}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <Image
                src="/assets/landing-page/images/one-journey.jpg"
                alt="A founder presenting prototypes on a video call"
                width={750}
                height={1000}
                sizes="(min-width: 1024px) 470px, 100vw"
                className="h-full max-h-[600px] w-full rounded-[10px] object-cover"
              />
            </div>
          </section>

          {/* ================= Duration band =========================== */}
          <section className="bg-forge-bg" aria-labelledby="duration-heading">
            <div className="bg-forge-pink lg:[clip-path:polygon(0_0,100%_0,calc(100%-118px)_100%,0_100%)]">
              <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-12 lg:flex-row lg:items-start lg:gap-16 lg:px-10 lg:py-16 lg:pr-[180px]">
                <Eyebrow tone="text-white" className="lg:w-[160px] lg:shrink-0 lg:pt-4">
                  Average
                  <br className="hidden lg:block" /> Expected
                  <br className="hidden lg:block" /> Duration
                </Eyebrow>

                <h2
                  id="duration-heading"
                  className="text-[54px] leading-[0.96] font-bold tracking-[-0.025em] text-white sm:text-[72px] lg:text-[86px]"
                >
                  4-6
                  <br />
                  Months
                </h2>

                <p className="text-[13px] leading-[19px] text-white lg:pt-4">
                  From initial concept to market-ready product.
                </p>
              </div>
            </div>
          </section>

          {/* ================= Manufacturing =========================== */}
          <section className="bg-forge-bg py-20 lg:py-28">
            <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <div className="grid gap-8 lg:grid-cols-[210px_minmax(0,1fr)_260px] lg:gap-10">
                <Eyebrow className="pt-3">
                  From
                  <br className="hidden lg:block" /> Prototype
                  <br className="hidden lg:block" /> To Production
                </Eyebrow>

                <h2 className="text-[54px] leading-[0.96] font-bold tracking-[-0.025em] sm:text-[72px] lg:text-[86px]">
                  Manufacturing
                  <br />
                  <span className="text-forge-pink">
                    Made
                    <br />
                    Simpler
                  </span>
                </h2>

                <p className="text-[13px] leading-[19px] text-[#55546c] lg:pt-3">
                  ATLAS Forge coordinates sourcing, expert advice, product testing and production
                  partners—so founders have one team guiding the move to market.
                </p>
              </div>

              <ol className="mt-16 grid grid-cols-1 gap-10 rounded-[10px] bg-forge-ink px-8 py-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-8 lg:px-14 lg:py-14">
                {MANUFACTURING.map((item) => (
                  <li key={item.number}>
                    <span className="block text-[12px] leading-none font-medium text-forge-pink">
                      {item.number}
                    </span>
                    <h3 className="mt-6 text-[21px] leading-[1.22] font-bold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-4 text-[12.5px] leading-[17px] text-white/72">{item.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ================= Products in development ================= */}
          <section className="relative overflow-hidden bg-forge-bg pb-20 lg:pb-28">
            <Blob className="-left-[190px] top-[90px] hidden lg:block" />

            <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <div className="rounded-[18px] bg-white/70 px-6 py-14 backdrop-blur-[2px] sm:px-10 lg:px-16 lg:py-20">
                <Eyebrow>Incubated Startups</Eyebrow>

                <h2 className="mt-7 text-[30px] leading-[1.16] font-bold tracking-[-0.02em] lg:text-[34px]">
                  Products In
                  <br />
                  Development.
                </h2>

                <div className="mt-14 flex flex-col gap-14">
                  {STARTUP_GROUPS.map((group, groupIndex) => (
                    <div
                      key={group.number}
                      className={
                        groupIndex > 0 ? 'border-t border-[#d9d8e4] pt-14' : undefined
                      }
                    >
                      <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
                        <div>
                          <p className="text-[14px] leading-none font-bold">{group.number}</p>
                          <p className="mt-6 text-[14px] leading-[19px] font-bold">
                            {group.category}
                          </p>
                        </div>

                        <ul className="grid grid-cols-1 gap-x-12 gap-y-12 sm:grid-cols-2">
                          {group.items.map((item, index) => (
                            <li key={`${group.number}-${index}`}>
                              <Image
                                src={item.logo}
                                alt={item.alt}
                                width={item.width}
                                height={item.height}
                                sizes="240px"
                                className={`${item.logoHeight} w-auto object-contain object-left`}
                              />
                              <h3 className="mt-5 text-[13.5px] leading-[19px] font-bold">
                                {item.title}
                              </h3>
                              <p className="mt-2 text-[12.5px] leading-[17px] text-[#55546c]">
                                {item.body}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ================= Success story ============================ */}
          <section className="bg-forge-bg pb-20 lg:pb-28" aria-labelledby="success-heading">
            <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-16 lg:px-10">
              <div>
                <Eyebrow>Our Success</Eyebrow>

                <h2
                  id="success-heading"
                  className="mt-7 text-[30px] leading-[1.16] font-bold tracking-[-0.02em] lg:text-[34px]"
                >
                  The Forge
                  <br />
                  Success Story
                </h2>

                <p className="mt-7 max-w-[400px] text-[13px] leading-[19px] text-[#55546c]">
                  Atlas Forge is a design-led incubation programme that equips early-stage founders
                  with the tools, mentors, and community to build products people genuinely love.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 lg:justify-self-end">
                <StoryVideo
                  src="https://atlasskilltech.app/atlas-forge-assets/success-story-01.mp4"
                  poster="/assets/landing-page/images/success-story-01-poster.jpg"
                  label="Play the first ATLAS Forge founder story"
                />
                <StoryVideo
                  src="https://atlasskilltech.app/atlas-forge-assets/success-story-02.mp4"
                  poster="/assets/landing-page/images/success-story-02-poster.jpg"
                  label="Play the second ATLAS Forge founder story"
                />
              </div>
            </div>
          </section>

          {/* ================= Atlas Concierge ========================== */}
          <section className="relative overflow-hidden bg-forge-bg pb-20 lg:pb-28">
            <Blob className="-left-[190px] top-[40px] hidden lg:block" />

            <div className="relative mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <div className="rounded-[18px] bg-white/70 px-6 py-14 backdrop-blur-[2px] sm:px-10 lg:px-16 lg:py-20">
                <Eyebrow>New Launches</Eyebrow>

                <h2 className="mt-7 text-[30px] leading-[1.16] font-bold tracking-[-0.02em] lg:text-[34px]">
                  Atlas Concierge
                </h2>

                <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                  <p className="max-w-[360px] text-[13px] leading-[19px] text-[#55546c]">
                    A paid design &amp; consultancy service for outside clients — delivered by
                    students, quality-checked by faculty, approved by the Atlas Forge team.
                  </p>

                  <EnquiryButton
                    sheet="service"
                    className="inline-flex h-[42px] w-fit shrink-0 items-center justify-center gap-1.5 rounded-[7px] bg-forge-purple px-6 text-[15px] text-white transition-colors hover:brightness-95"
                  >
                    <span className="font-bold">Have a Question?</span> Talk to us
                  </EnquiryButton>
                </div>

                <ul className="mt-12 grid grid-cols-2 gap-5 lg:grid-cols-4 lg:gap-6">
                  {CONCIERGE.map((project, index) => (
                    <li
                      key={`${project.alt}-${index}`}
                      className="rounded-[10px] bg-white p-3.5 shadow-[0_2px_14px_-8px_rgb(26_20_80/0.22)]"
                    >
                      <div className="aspect-square w-full overflow-hidden rounded-[7px] bg-[#f2f2f4]">
                        <Image
                          src={project.image}
                          alt={project.alt}
                          width={520}
                          height={520}
                          sizes="(min-width: 1024px) 220px, 44vw"
                          className="size-full object-cover"
                        />
                      </div>
                      <p className="mt-4 mb-1.5 text-[14px] leading-none font-bold text-forge-ink">
                        {project.label}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* ================= Core team ================================ */}
          <section className="bg-forge-bg-alt py-20 lg:py-28" aria-labelledby="team-heading">
            <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
              <Eyebrow>Core Team</Eyebrow>

              <h2
                id="team-heading"
                className="mt-7 text-[30px] leading-[1.16] font-bold tracking-[-0.02em] lg:text-[34px]"
              >
                Built by founders.
                <br />
                For founders.
              </h2>

              <ul className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-16 lg:gap-16">
                {TEAM.map((person) => (
                  <li key={person.name}>
                    <Image
                      src={person.photo}
                      alt={person.name}
                      width={750}
                      height={1000}
                      sizes="(min-width: 1024px) 420px, 100vw"
                      /* The reference renders both portraits in greyscale. */
                      className="h-[380px] w-full max-w-[420px] object-cover object-top grayscale lg:h-[440px]"
                    />

                    <h3 className="mt-7 text-[22px] leading-none font-bold">{person.name}</h3>
                    <p className="mt-3 text-[13px] leading-none text-[#55546c]">{person.role}</p>
                    <p className="mt-6 max-w-[420px] text-[12.5px] leading-[18px] text-forge-ink">
                      {person.body}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* ================= FAQs ===================================== */}
          <FaqSection />
        </main>

        <LandingFooter />
      </div>
    </EnquiryProvider>
  )
}

/* -------------------------------------------------------------------------- */
/* Footer                                                                     */
/* -------------------------------------------------------------------------- */

function LandingFooter() {
  return (
    <footer className="bg-forge-bg-alt pt-20 pb-10 lg:pt-24">
      <div className="mx-auto w-full max-w-[1400px] px-6 lg:px-10">
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-10">
          {/* ---- Brand column ------------------------------------------ */}
          <div>
            <Image
              src="/assets/landing-page/images/atlas-forge-wordmark.png"
              alt={siteConfig.name}
              width={250}
              height={70}
              sizes="240px"
              className="h-[48px] w-auto"
            />

            <p className="mt-7 text-[11px] leading-none text-forge-ink">An unit under</p>

            <Image
              src="/assets/landing-page/images/unit-under-strip.png"
              alt="ATLAS SkillTech University — ISDI, ISME, uGDX and LAW"
              width={375}
              height={38}
              sizes="340px"
              className="mt-3 h-[26px] w-auto"
            />

            <ul className="mt-10 flex flex-col gap-4 text-[12.5px] leading-none text-forge-ink">
              <li>
                <a href="#about" className="transition-opacity hover:opacity-65">
                  Programmes
                </a>
              </li>
              <li>
                <a href="#infrastructure" className="transition-opacity hover:opacity-65">
                  Community
                </a>
              </li>
              <li>
                <EnquiryButton sheet="service" className="transition-opacity hover:opacity-65">
                  Atlas Concierge
                </EnquiryButton>
              </li>
              <li>
                <a href="#faq-heading" className="transition-opacity hover:opacity-65">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* ---- Call to action column --------------------------------- */}
          <div>
            <h2 className="text-[34px] leading-[1.14] font-bold tracking-[-0.02em] lg:text-[40px]">
              Bring the idea.
              <br />
              Build the product.
            </h2>

            <p className="mt-5 text-[12.5px] leading-[18px] text-[#55546c]">
              ATLAS Forge gives founders the facilities, experts and path to move forward.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[7px] bg-forge-ink px-7 text-[15px] font-medium text-white transition-colors hover:bg-forge-purple"
              >
                Apply for incubation <ArrowIcon />
              </Link>

              <EnquiryButton
                sheet="partner"
                className="inline-flex h-[44px] items-center justify-center gap-2 rounded-[7px] border border-forge-ink/35 bg-white px-7 text-[15px] font-medium text-forge-ink transition-colors hover:border-forge-ink"
              >
                Partner with ATLAS Forge <ArrowIcon />
              </EnquiryButton>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 text-[12px] leading-none">
              <p>
                <span className="font-bold">Write to us</span>{' '}
                <a
                  href="mailto:mihir.pawar@atlasuniversity.edu.in"
                  className="ml-2 text-forge-ink transition-opacity hover:opacity-65"
                >
                  mihir.pawar@atlasuniversity.edu.in
                </a>
              </p>
              <p>
                <span className="font-bold">Contact us</span>{' '}
                <a
                  href="tel:+919619590937"
                  className="ml-2 text-forge-ink transition-opacity hover:opacity-65"
                >
                  +91 96195 90937
                </a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-[#d2d2d2] pt-6 sm:flex-row sm:items-end sm:justify-between">
          <p className="text-[11px] leading-[15px] text-forge-ink">
            ATLAS FORGE
            <br />
            Product Incubation Centre · Mumbai
          </p>
          <p className="text-[11px] leading-none text-forge-ink">© 2026</p>
        </div>
      </div>
    </footer>
  )
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor">
      <path d="M4.5 11.5L11.5 4.5M5.5 4.5h6v6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/**
 * The soft violet quarter-circle that bleeds in from the left edge behind
 * three of the white panels. Reference asset: "Ellipse 5.png".
 */
function Blob({ className = '' }) {
  return (
    <Image
      src="/assets/landing-page/images/purple-blob.png"
      alt=""
      aria-hidden="true"
      width={601}
      height={603}
      sizes="380px"
      className={`pointer-events-none absolute -z-0 h-auto w-[380px] select-none ${className}`}
    />
  )
}
