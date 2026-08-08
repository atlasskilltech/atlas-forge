import Link from 'next/link'
import { Avatar, Button, Card, Chip, SectionLabel, StatCard } from '@/components/ui'

/**
 * Reference: /reference/mast ui/Founder/My Startup Page.png
 *            /reference/mast phone ui/Founder/My Startup Page.png
 */
export default function StartupPage({ startup }) {
  if (!startup) return null
  const myStartup = startup

  return (
    <>
      <Card padding="lg" className="lg:px-7 lg:py-7">
        <div className="flex items-start gap-4 lg:gap-6">
          <Avatar
            initials={myStartup.initial}
            tone="primary"
            shape="square"
            size="xl"
            className="lg:size-16 lg:text-xl"
          />
          <div className="min-w-0">
            <p className="text-lg font-bold text-ink lg:text-[22px]">{myStartup.name}</p>
            <p className="mt-1 text-[13px] leading-[18px] text-muted lg:hidden">
              {myStartup.mobileTagline}
            </p>
            <p className="mt-1.5 hidden text-sm text-muted lg:block">
              {myStartup.tagline}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {myStartup.mobileTags.map((tag) => (
                <Chip key={tag} tone="skill" size="lg" className="lg:hidden">
                  {tag}
                </Chip>
              ))}
              {myStartup.tags.map((tag) => (
                <Chip key={tag} tone="skill" size="lg" className="hidden lg:inline-flex">
                  {tag}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-2.5 lg:mt-5 lg:gap-3">
        {myStartup.mobileStats.map((stat) => (
          <StatCard key={stat.label} {...stat} compact className="lg:hidden" />
        ))}
        {myStartup.stats.map((stat) => (
          <StatCard
            key={stat.label}
            {...stat}
            className="hidden min-w-[130px] lg:block"
          />
        ))}
      </div>

      <SectionLabel className="mt-5">Team{' '}<span className="hidden lg:inline">Members</span></SectionLabel>

      <Card padding="lg" className="mt-3 hidden lg:block lg:px-7 lg:py-6">
        <ul className="space-y-3">
          {myStartup.team.map((member) => (
            <li key={member.id} className="flex items-center gap-4">
              <Avatar
                initials={member.initials}
                tone={member.tone}
                shape="square"
                size="md"
              />
              <p className="w-[210px] shrink-0 text-[15px] font-bold text-ink">
                {member.name}
              </p>
              <p className="text-[13px] text-muted">{member.role}</p>
            </li>
          ))}
        </ul>
        <Button
          variant="subtle"
          size="lg"
          disabled
          title="Adding a team member needs a form, which is not designed yet"
          className="mt-4 border-0 bg-primary-100 text-primary-text"
        >
          + Add Team Member (App ID)
        </Button>
      </Card>

      <ul className="mt-3 space-y-3 lg:hidden">
        {myStartup.team.slice(0, 2).map((member) => (
          <li key={member.id}>
            <Card padding="lg" className="flex items-center gap-3.5">
              <Avatar
                initials={member.initials}
                tone={member.tone}
                shape="square"
                size="lg"
              />
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold text-ink">
                  {member.shortName}
                </p>
                <p className="text-[13px] text-muted">{member.shortRole}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-3 lg:hidden">
        <Button as={Link} href="/founder/edit-listing" fullWidth className="h-12">
          Edit Listing
        </Button>
      </div>
    </>
  )
}
