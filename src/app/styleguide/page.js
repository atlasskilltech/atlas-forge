import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardHeader,
  Chip,
  FormField,
  PageTitle,
  ProgressRing,
  SectionLabel,
  SectionTitle,
  StatCard,
  Subtle,
} from '@/components/ui'
import { ROLE_LIST } from '@/config/roles'
import { buildMetadata } from '@/lib/seo'

export const metadata = buildMetadata({
  title: 'Design System',
  description: 'Internal reference for the ATLAS Forge component library.',
  path: '/styleguide',
  noIndex: true,
})

function Row({ title, children }) {
  return (
    <section className="space-y-3">
      <SectionLabel>{title}</SectionLabel>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  )
}

export default function StyleguidePage() {
  return (
    <main id="main-content" className="mx-auto max-w-5xl space-y-10 px-4 py-10 md:px-8">
      <header className="space-y-1">
        <PageTitle>ATLAS Forge Design System</PageTitle>
        <Subtle>
          Tokens and primitives extracted pixel-for-pixel from the Figma reference set.
        </Subtle>
      </header>

      <Row title="Colour tokens">
        {[
          ['primary-500', 'bg-primary-500'],
          ['primary-100', 'bg-primary-100'],
          ['success', 'bg-success'],
          ['warning', 'bg-warning'],
          ['danger', 'bg-danger'],
          ['muted', 'bg-muted'],
          ['navy-900', 'bg-navy-900'],
          ['navy-active', 'bg-navy-active'],
          ['canvas', 'bg-canvas'],
          ['line', 'bg-line'],
        ].map(([name, klass]) => (
          <div key={name} className="w-28 space-y-1.5">
            <div className={`h-12 rounded-tile border border-line ${klass}`} />
            <p className="text-[11px] text-muted">{name}</p>
          </div>
        ))}
      </Row>

      <Row title="Buttons">
        <Button variant="primary" size="lg">
          Contact Student
        </Button>
        <Button variant="secondary">View Full Profile</Button>
        <Button variant="subtle">Manage</Button>
        <Button variant="approve" leadingIcon="✓">
          Approve
        </Button>
        <Button variant="reject" leadingIcon="✕">
          Reject
        </Button>
        <Button variant="danger">Revoke Access</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="link">Sign in with a different account</Button>
      </Row>

      <Row title="Button — full width (mobile)">
        <div className="w-full max-w-[358px]">
          <Button fullWidth>Save Changes</Button>
        </div>
      </Row>

      <Row title="Status chips">
        <Chip status="Active" dot />
        <Chip status="Available" dot />
        <Chip status="Live" />
        <Chip status="Approved" />
        <Chip status="Pending" dot />
        <Chip status="Requested" />
        <Chip status="Applied" />
        <Chip status="Interview" />
        <Chip status="Rejected" />
        <Chip status="Done" />
        <Chip status="View-only" />
        <Chip tone="skill">UI/UX</Chip>
        <Chip tone="skill">Branding</Chip>
        <Chip tone="skill">Figma</Chip>
      </Row>

      <Row title="Avatars">
        <Avatar name="Riya Kapoor" />
        <Avatar name="Mihir Pawar" tone="dark" />
        <Avatar name="Riya Kapoor" variant="soft" shape="square" size="lg" />
        {ROLE_LIST.map((role) => (
          <Avatar
            key={role.id}
            initials={role.initials}
            variant="soft"
            tone={role.tone}
            shape="square"
            size="xl"
          />
        ))}
      </Row>

      <Row title="Badges">
        <Badge count={3} />
        <Badge count={7} />
        <Badge count={128} />
      </Row>

      <section className="space-y-3">
        <SectionLabel>Stat cards</SectionLabel>
        <div className="flex flex-wrap gap-3">
          <StatCard value="12" label="Total Students" tone="primary" />
          <StatCard value="5" label="Pending Approvals" tone="warning" />
          <StatCard value="3" label="Active Startups" tone="success" />
          <StatCard value="0" label="Platform Errors" tone="neutral" />
          <StatCard value="Active" label="Availability Status" tone="success" />
          <StatCard value="12" label="Students" tone="primary" compact />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Banners</SectionLabel>
        <Banner icon="👁">
          You are in view-only mode. No actions can be taken from this account.
        </Banner>
        <Banner tone="success" icon="✓">
          Founder access granted to Shantanu Ghuriani.
        </Banner>
        <Banner tone="danger" icon="✕">
          Job listing rejected: &apos;Unrelated to incubation&apos;.
        </Banner>
      </section>

      <section className="space-y-3">
        <SectionLabel>Cards</SectionLabel>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="max-w-[340px]">
            <h3 className="text-[15px] font-bold text-ink">UI/UX Designer Needed</h3>
            <p className="mt-1 text-[13px] text-muted">
              NovaMed · Full-time · Pending Approval
            </p>
            <p className="mt-2.5 text-[13px] text-muted">
              Looking for a product designer to lead the mobile app redesign.
            </p>
            <div className="mt-3 flex gap-2">
              <Chip tone="skill">Design</Chip>
              <Chip tone="skill">Mobile</Chip>
            </div>
          </Card>

          <Card className="max-w-[340px]">
            <div className="flex items-center gap-3">
              <Avatar name="Riya Kapoor" shape="square" size="lg" />
              <div>
                <p className="text-[15px] font-bold text-ink">Riya Kapoor</p>
                <p className="text-[13px] text-muted">BDes · 3rd Year · ATL-2024-0871</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip tone="skill">UI/UX</Chip>
              <Chip tone="skill">Branding</Chip>
              <Chip tone="skill">Figma</Chip>
            </div>
          </Card>
        </div>

        <Card padding="lg">
          <CardHeader title="Recent Activity" />
          <div className="mt-3 space-y-2">
            {[
              ['Applied for UI/UX Designer at NovaMed', 'Today · 10:45 AM', 'Pending'],
              ['Flagged availability: 10 hrs/week', 'Yesterday · 4:20 PM', 'Active'],
              ['Mentorship session requested', 'Jun 20 · Awaiting Mihir', 'Requested'],
            ].map(([title, meta, status]) => (
              <div
                key={title}
                className="flex items-center gap-3 rounded-tile border border-line-soft px-3.5 py-3"
              >
                <span aria-hidden="true" className="size-2 rounded-full bg-primary-500" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{title}</p>
                  <p className="text-[13px] text-muted">{meta}</p>
                </div>
                <Chip status={status} />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionLabel>Form fields</SectionLabel>
        <div className="grid max-w-2xl gap-4 md:grid-cols-2">
          <FormField label="App ID" placeholder="e.g. ATL-2024-0871" />
          <FormField label="Password" type="password" placeholder="Enter your password" />
          <FormField
            label="Role"
            as="select"
            options={ROLE_LIST.map((r) => ({ value: r.id, label: r.label }))}
          />
          <FormField label="Field with error" placeholder="Placeholder text" error="This field is required." />
          <FormField
            label="Description"
            as="textarea"
            placeholder="Placeholder text"
            hint="Keep it under 300 characters."
            containerClassName="md:col-span-2"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Progress</SectionLabel>
        <div className="flex flex-wrap items-center gap-6">
          <ProgressRing value={0} label="Readiness" />
          <ProgressRing value={65} label="Readiness" caption="65%" />
          <ProgressRing
            value={100}
            label="Complete"
            size={100}
            thickness={13}
            tone="var(--color-success)"
          />
        </div>
      </section>

      <section className="space-y-3">
        <SectionLabel>Typography</SectionLabel>
        <div className="space-y-2">
          <PageTitle>Welcome back, Shantanu</PageTitle>
          <SectionTitle>Quick Actions</SectionTitle>
          <SectionLabel>Recent Platform Activity</SectionLabel>
          <Subtle>Full override access. All platform operations visible from here.</Subtle>
        </div>
      </section>
    </main>
  )
}
