'use client'

import { useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  SectionLabel,
  StatCard,
} from '@/components/ui'
import ContactManagerCta from '@/components/shared/ContactManagerCta'
import SkillTagRow from './SkillTagRow'
import { profileStats, studentProfile } from '@/data/student'

/**
 * Reference: /reference/mast ui/Student/My Profile.png
 *            /reference/mast phone ui/Student/My Profile.png
 *            /reference/mast ui/Overlay/Shared My Profile Saved.png
 */
export default function ProfilePanel() {
  const [saved, setSaved] = useState(false)

  return (
    <>
      <Card padding="lg" className="lg:px-7 lg:py-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5 lg:gap-5">
            <Avatar
              name={studentProfile.name}
              initials={studentProfile.initials}
              shape="square"
              size="xl"
              className="lg:size-[62px] lg:text-lg"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold text-ink lg:text-[22px]">
                {studentProfile.name}
              </p>
              <p className="mt-0.5 text-[13px] text-muted lg:hidden">
                BDes · {studentProfile.year} · {studentProfile.appId}
              </p>
              <p className="mt-1 hidden text-sm text-muted lg:block">
                {studentProfile.programme} · {studentProfile.year} ·{' '}
                {studentProfile.appId} · {studentProfile.email}
              </p>
              <Chip tone="success" size="lg" className="mt-2">
                {studentProfile.availability}
              </Chip>
            </div>
          </div>
          <Button variant="secondary" size="lg" className="hidden shrink-0 lg:inline-flex">
            Edit Profile
          </Button>
        </div>
      </Card>

      <Button variant="subtle" fullWidth className="mt-4 h-11 lg:hidden">
        Edit Profile
      </Button>

      <SectionLabel className="mt-4 lg:mt-5">My Skills</SectionLabel>

      <Card padding="lg" className="mt-3 hidden lg:block lg:px-7 lg:py-7">
        <SkillTagRow skills={studentProfile.skills} />
        <Button variant="secondary" size="lg" className="mt-4">
          Edit Skills &amp; Availability
        </Button>
      </Card>

      <div className="mt-3 lg:hidden">
        <SkillTagRow skills={studentProfile.mobileSkills} />
        <Button fullWidth className="mt-4 h-12" onClick={() => setSaved(true)}>
          Save Changes
        </Button>
      </div>

      <div className="hidden lg:block">
        <SectionLabel className="mt-5">My Activity</SectionLabel>
        <div className="mt-3 flex flex-wrap gap-3">
          {profileStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
        <div className="mt-5">
          <ContactManagerCta />
        </div>
      </div>

      <ConfirmDialog
        open={saved}
        onClose={() => setSaved(false)}
        title="Profile Updated"
        description="Your changes have been saved across all your roles on ATLAS Forge."
      />
    </>
  )
}
