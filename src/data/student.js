/**
 * Mock content for the Student module, transcribed from the Figma references.
 * Replaced by API calls when the backend section is built — the shapes here
 * are what the components consume.
 */

export const studentProfile = {
  name: 'Riya Kapoor',
  initials: 'RK',
  programme: 'BDes Product Design',
  year: '3rd Year',
  appId: 'ATL-2024-0871',
  email: 'riya.kapoor@atlasuniversity.edu.in',
  availability: 'Available · 10 hrs/week',
  hoursPerWeek: '10 hrs/week',
  workTypes: 'Design · Research',
  timing: 'Weekdays · Evenings',
  concierge: 'You are visible to Founders in the Concierge pool · 10 hrs/week · Weekday evenings',
  skills: ['UI/UX Design', 'Figma', 'Branding', 'User Research', 'Prototyping'],
  mobileSkills: ['UI/UX', 'Figma', 'Branding'],
}

export const homeStats = [
  { value: 'Active', label: 'Availability Status', tone: 'success' },
  { value: '2', label: 'Active Applications', tone: 'primary' },
  { value: '3', label: 'Projects Exploring', tone: 'primary' },
  { value: '1', label: 'Mentorship Session', tone: 'primary' },
]

export const mobileHomeStats = [
  { value: '2', label: 'Applications', tone: 'primary' },
  { value: '1', label: 'Mentor', tone: 'primary' },
  { value: 'Active', label: 'Available', tone: 'success' },
]

export const homeQuickActions = [
  { label: 'Flag Availability', href: '/student/availability', primary: true },
  { label: 'Browse Jobs', href: '/student/jobs' },
  { label: 'Browse Projects', href: '/student/projects' },
  { label: 'Request Mentorship', href: '/student/mentorship' },
]

export const mobileHomeActions = [
  { icon: '💼', label: 'Browse Jobs', href: '/student/jobs' },
  { icon: '🚀', label: 'Browse Projects', href: '/student/projects' },
  { icon: '📝', label: 'Flag Availability', href: '/student/availability' },
]

export const recentActivity = [
  {
    id: 'act-1',
    title: 'Applied for UI/UX Designer at NovaMed',
    meta: 'Today · 10:45 AM',
    status: 'Pending',
    tone: 'info',
    dot: 'primary',
  },
  {
    id: 'act-2',
    title: 'Flagged availability: 10 hrs/week',
    meta: 'Yesterday · 4:20 PM',
    status: 'Active',
    tone: 'success',
    dot: 'success',
  },
  {
    id: 'act-3',
    title: 'Mentorship session requested',
    meta: 'Jun 20 · Awaiting Mihir',
    status: 'Requested',
    tone: 'warning',
    dot: 'warning',
  },
]

export const jobFilters = ['All', 'Full-time', 'Part-time', 'Contract', 'Collab / No Pay']

export const jobs = [
  {
    id: 'job-1',
    title: 'UI/UX Designer',
    company: 'NovaMed',
    type: 'Full-time',
    status: 'Live',
    skills: ['Design', 'Figma'],
    detailMeta: 'NovaMed · Full-time · ATLAS Forge Incubated',
    detailSkills: ['Design', 'Mobile', 'Figma', 'UX Research'],
    description:
      "We're looking for a talented product designer to lead the mobile app redesign for our health monitoring platform. You'll own the full design process from research to final handoff.",
    // The desktop reference shows this role still open; only the mobile
    // Browse Jobs frame draws it in the applied state (see mobileJobs).
    applied: false,
  },
  {
    id: 'job-2',
    title: 'Frontend Developer',
    company: 'EduTrack',
    type: 'Part-time',
    status: 'Live',
    skills: ['React', 'TypeScript'],
    detailMeta: 'EduTrack · Part-time · ATLAS Forge Incubated',
    detailSkills: ['React', 'TypeScript', 'Testing'],
    description:
      'Join the EduTrack engineering team to build the adaptive learning experience used by thousands of students.',
    applied: false,
  },
  {
    id: 'job-3',
    title: 'Marketing Lead',
    company: 'NovaMed',
    type: 'Contract',
    status: 'Live',
    skills: ['GTM', 'Content'],
    detailMeta: 'NovaMed · Contract · ATLAS Forge Incubated',
    detailSkills: ['GTM', 'Content', 'Analytics'],
    description:
      'Own go-to-market for the NovaMed launch — positioning, content and early growth experiments.',
    applied: false,
  },
  {
    id: 'job-4',
    title: 'Brand Collab',
    company: 'GreenGrid',
    type: 'Collab / No Pay',
    status: 'Collab',
    skills: ['Branding'],
    detailMeta: 'GreenGrid · No pay · ATLAS Forge Incubated',
    detailSkills: ['Branding', 'Identity'],
    description:
      'Help shape the GreenGrid brand identity ahead of the pilot launch. Portfolio-friendly collaboration.',
    applied: false,
  },
]

/** Mobile Browse Jobs shows a shorter, differently-typed list. */
export const mobileJobs = [
  { id: 'm-job-1', title: 'UI/UX Designer', company: 'NovaMed', type: 'Full-time', applied: true },
  { id: 'm-job-2', title: 'Frontend Dev', company: 'EduTrack', type: 'Part-time', applied: false },
  { id: 'm-job-3', title: 'Marketing Lead', company: 'NovaMed', type: 'Contract', applied: false },
  { id: 'm-job-4', title: 'Data Analyst', company: 'EduTrack', type: 'Part-time', applied: false },
]

export const projectFilters = [
  'All',
  'HealthTech',
  'EdTech',
  'CleanTech',
  'Actively Hiring',
  'New This Month',
]

export const startups = [
  {
    id: 'novamed',
    name: 'NovaMed',
    initial: 'N',
    tone: 'primary',
    hiring: true,
    tags: ['HealthTech', 'Early Traction'],
    description: 'AI-powered health monitoring for preventive care.',
    openRoles: 3,
    sector: 'HealthTech',
  },
  {
    id: 'edutrack',
    name: 'EduTrack',
    initial: 'E',
    tone: 'success',
    hiring: true,
    tags: ['EdTech', 'Prototype'],
    description: 'Adaptive learning platform for personalised student paths.',
    openRoles: 2,
    sector: 'EdTech',
  },
  {
    id: 'greengrid',
    name: 'GreenGrid',
    initial: 'G',
    tone: 'success',
    hiring: false,
    tags: ['CleanTech', 'Idea'],
    description: 'Peer-to-peer renewable energy trading for solar users.',
    openRoles: 0,
    sector: 'CleanTech',
  },
]

export const applications = [
  {
    id: 'app-1',
    role: 'UI/UX Designer',
    company: 'NovaMed',
    initial: 'N',
    tone: 'warning',
    meta: 'Full-time · Applied today',
    status: 'Under Review',
    statusTone: 'warning',
  },
  {
    id: 'app-2',
    role: 'Brand Collab',
    company: 'GreenGrid',
    initial: 'G',
    tone: 'primary',
    meta: 'No pay · Applied Jun 18',
    status: 'Shortlisted',
    statusTone: 'info',
  },
  {
    id: 'app-3',
    role: 'Frontend Dev',
    company: 'EduTrack',
    initial: 'E',
    tone: 'neutral',
    meta: 'Part-time · Applied Jun 10',
    status: 'Not Selected',
    statusTone: 'neutral',
  },
]

/** The mobile frame lists different roles and statuses than the desktop one. */
export const mobileApplications = [
  { id: 'm-app-1', role: 'UI/UX Designer', status: 'Interview', statusTone: 'success' },
  { id: 'm-app-2', role: 'Frontend Dev', status: 'Under Review', statusTone: 'warning' },
  { id: 'm-app-3', role: 'Marketing Lead', status: 'Applied', statusTone: 'info' },
]

export const mentorSessions = [
  {
    id: 'ses-1',
    when: 'Thu, 24 Jul · 3:00 PM',
    status: 'Upcoming',
    statusTone: 'info',
    mentor: 'Mentor: Mihir Pawar',
    topic: 'Product-market fit strategy for NovaMed Q3',
  },
  {
    id: 'ses-2',
    when: 'Mon, 14 Jul · 11AM',
    status: 'Completed',
    statusTone: 'success',
    mentor: 'Mentor: Mihir Pawar',
    topic: 'Pitch deck feedback and financial projections',
  },
  {
    id: 'ses-3',
    when: 'Pending Assignment',
    status: 'Requested',
    statusTone: 'warning',
    mentor: 'Mentor: TBD',
    topic: 'UX guidance — requested Faculty mentor',
  },
]

export const assignedMentor = {
  name: 'Mihir Pawar',
  initials: 'MP',
  role: 'Forge Manager · Mentor',
}

export const mentorTypes = [
  'Faculty Mentor',
  'Alumni Mentor',
  'Industry Mentor',
  'No preference',
]

export const engagementTypes = ['No Pay / Learning collab', 'Revenue Share', 'Part-time paid']

export const incubationStages = ['Idea', 'Prototype', 'Early Traction']

export const readinessItems = [
  {
    id: 'pitch',
    label: 'Pitch Deck or Concept Note',
    hint: "Deck link, or a brief concept note if you don't have one yet",
    placeholder: 'Paste link or attach file...',
  },
  {
    id: 'demo',
    label: 'Product Demo / Link',
    hint: 'Live demo, prototype, or tester Figma link',
    placeholder: 'https://...',
  },
  {
    id: 'assets',
    label: 'Product Assets',
    hint: 'Designs, repo, or any supporting material',
    placeholder: 'Paste link or attach file...',
  },
  {
    id: 'personnel',
    label: 'Key Personnel',
    hint: 'Who is on the founding team and what they own',
    placeholder: 'e.g. Riya Kapoor — Design, Arjun Mehta — Engineering',
  },
]

export const profileStats = [
  { value: '2', label: 'Active Applications', tone: 'primary' },
  { value: '1', label: 'Mentorship Session', tone: 'primary' },
  { value: '3', label: 'Projects Exploring', tone: 'primary' },
  { value: 'Active', label: 'Availability', tone: 'success' },
]
