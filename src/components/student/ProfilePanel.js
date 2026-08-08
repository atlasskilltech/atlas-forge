'use client'

import {
  Avatar,
  Button,
  Card,
  Chip,
  SectionLabel,
  StatCard,
} from '@/components/ui'
import Link from 'next/link'
import ContactManagerCta from '@/components/shared/ContactManagerCta'
import SkillTagRow from './SkillTagRow'

/**
 * Reference: /reference/mast ui/Student/My Profile.png
 *            /reference/mast phone ui/Student/My Profile.png
 *            /reference/mast ui/Overlay/Shared My Profile Saved.png
 */
export default function ProfilePanel({ profile, stats = [] }) {
  return (
    <>
      <Card padding="lg" className="lg:px-7 lg:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 lg:gap-5">
            <Avatar
              name={profile.name}
              initials={profile.initials}
              shape="square"
              size="xl"
              className="lg:size-[62px] lg:text-lg"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink lg:text-[22px]">
                {profile.name}
              </p>
              <p className="mt-0.5 text-[13px] text-muted lg:hidden">
                BDes · {profile.year} · {profile.appId}
              </p>
              <p className="mt-1 hidden text-sm text-muted lg:block">
                {profile.programme} · {profile.year} ·{' '}
                {profile.appId} · {profile.email}
              </p>
              <Chip tone="success" size="lg" className="mt-2">
                {profile.availability}
              </Chip>
            </div>
          </div>
          <Button variant="secondary" size="lg" disabled title="Profile editing has no screen yet" className="hidden shrink-0 lg:inline-flex">
            Edit Profile
          </Button>
        </div>
      </Card>

      <Button variant="subtle" fullWidth disabled title="Profile editing has no screen yet" className="mt-4 h-11 lg:hidden">
        Edit Profile
      </Button>

      <SectionLabel className="mt-4 lg:mt-5">My Skills</SectionLabel>

      <Card padding="lg" className="mt-3 hidden lg:block lg:px-7 lg:py-7">
        <SkillTagRow skills={profile.skills} />
        <Button
          as={Link}
          href="/student/availability"
          variant="secondary"
          size="lg"
          className="mt-4"
        >
          Edit Skills &amp; Availability
        </Button>
      </Card>

      <div className="mt-3 lg:hidden">
        <SkillTagRow skills={profile.mobileSkills} />
        {/* The mobile frame draws the skill chips read-only — there is no field
            to edit and so nothing to submit. The button stays visible and
            disabled until an edit screen is designed, rather than reporting a
            save that never happened. */}
        <Button fullWidth className="mt-4 h-12" disabled>
          Save Changes
        </Button>
      </div>

      <div className="hidden lg:block">
        <SectionLabel className="mt-5">My Activity</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-3">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
        <div className="mt-5">
          <ContactManagerCta />
        </div>
      </div>
    </>
  )
}
