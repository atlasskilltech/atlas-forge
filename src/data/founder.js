/**
 * Mock content for the Founder module, transcribed from the Figma references.
 * Replaced by API calls when the backend section is built.
 */

export const founderProfile = {
  name: 'Shantanu Ghuriani',
  shortName: 'Shantanu',
  initials: 'SG',
  role: 'Founder',
  startup: 'NovaMed',
  appId: 'ATL-2022-0012',
  email: 'shantanughuriani@gmail.com',
  bio: 'Founder of NovaMed — building AI-powered preventive health tools.',
  badge: 'Founder Unlocked',
}

export const homeStats = [
  { value: 'NovaMed', label: 'My Startup', tone: 'ink' },
  { value: '3', label: 'Open Roles Posted', tone: 'primary' },
  { value: '7', label: 'Student Contacts', tone: 'primary' },
  { value: '2', label: 'Mentorship Sessions', tone: 'primary' },
  { value: 'Active', label: 'Incubation Status', tone: 'success' },
]

export const mobileHomeStats = [
  { value: '4', label: 'Team', tone: 'primary' },
  { value: '3', label: 'Roles', tone: 'success' },
  { value: 'Seed', label: 'Stage', tone: 'warning' },
]

export const homeQuickActions = [
  { label: 'Search Student Pool', href: '/founder/student-pool', primary: true },
  { label: 'Post a Job', href: '/founder/post-job' },
  { label: 'Request Mentorship', href: '/founder/mentorship' },
  { label: 'View My Listings', href: '/founder/listings' },
]

export const mobileHomeActions = [
  { label: 'Post Job', href: '/founder/post-job', primary: true },
  { label: 'Search', href: '/founder/student-pool' },
  { label: 'My Startup', href: '/founder/startup' },
]

export const homeDate = 'Thu, 23 July 2026'

export const recentActivity = [
  {
    id: 'f-act-1',
    title: 'Riya Kapoor contacted via Concierge',
    meta: 'Today · 11:32 AM · CC: Mihir Pawar',
    status: 'Pending',
    tone: 'info',
    dot: 'primary',
  },
  {
    id: 'f-act-2',
    title: 'UI/UX Designer listing approved by Mihir',
    meta: 'Yesterday · 3:14 PM',
    status: 'Live',
    tone: 'success',
    dot: 'success',
  },
  {
    id: 'f-act-3',
    title: 'Mentorship session request submitted',
    meta: 'Jun 20, 2026 · Awaiting assignment',
    status: 'In Review',
    tone: 'warning',
    dot: 'warning',
  },
]

export const mobileActivity = [
  { id: 'm-f-1', initials: 'RK', tone: 'primary', title: 'Riya Kapoor applied', meta: '2h ago' },
  { id: 'm-f-2', initials: 'MP', tone: 'success', title: 'Mihir Pawar approved', meta: 'Yesterday' },
  { id: 'm-f-3', initials: 'AM', tone: 'warning', title: 'Arjun joined team', meta: 'Jun 20' },
]

export const poolFilters = ['All', 'Design', 'Tech', 'Business', 'Available Now']

export const studentPool = [
  {
    id: 'riya',
    name: 'Riya Kapoor',
    initials: 'RK',
    tone: 'primary',
    meta: 'BDes · 3rd Year · ATL-2024-0871',
    detailMeta: 'BDes Product Design · 3rd Year · ATL-2024-0871',
    mobileMeta: 'BDes · 3rd Year · UI/UX',
    skills: ['UI/UX', 'Branding', 'Figma'],
    available: true,
    track: 'Design',
    stats: [
      { value: '3', label: 'Projects done', tone: 'primary' },
      { value: '10 hrs', label: 'Per week', tone: 'ink' },
      { value: '2', label: 'Engagements', tone: 'primary' },
    ],
  },
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    initials: 'AM',
    tone: 'success',
    meta: 'BTech · 2nd Year · ATL-2023-0342',
    detailMeta: 'BTech Computer Science · 2nd Year · ATL-2023-0342',
    mobileMeta: 'BTech · 2nd Year · React',
    skills: ['React', 'Node.js'],
    available: true,
    track: 'Tech',
    stats: [
      { value: '2', label: 'Projects done', tone: 'primary' },
      { value: '12 hrs', label: 'Per week', tone: 'ink' },
      { value: '1', label: 'Engagements', tone: 'primary' },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Shah',
    initials: 'PS',
    tone: 'danger',
    meta: 'BBA · 4th Year · ATL-2021-0119',
    detailMeta: 'BBA Marketing · 4th Year · ATL-2021-0119',
    mobileMeta: 'BBA · 4th Year · Marketing',
    skills: ['Marketing', 'GTM'],
    available: false,
    track: 'Business',
    stats: [
      { value: '4', label: 'Projects done', tone: 'primary' },
      { value: '8 hrs', label: 'Per week', tone: 'ink' },
      { value: '3', label: 'Engagements', tone: 'primary' },
    ],
  },
  {
    id: 'vivaan',
    name: 'Vivaan Nair',
    initials: 'VN',
    tone: 'warning',
    meta: 'BTech · 1st Year · ATL-2025-0988',
    detailMeta: 'BTech Data Science · 1st Year · ATL-2025-0988',
    mobileMeta: 'BTech · 1st Year · ML',
    skills: ['Python', 'ML'],
    available: true,
    track: 'Tech',
    stats: [
      { value: '1', label: 'Projects done', tone: 'primary' },
      { value: '15 hrs', label: 'Per week', tone: 'ink' },
      { value: '1', label: 'Engagements', tone: 'primary' },
    ],
  },
]

export const conciergeContactLog = [
  {
    id: 'cl-1',
    title: 'NovaMed Startup',
    detail: 'Brand identity project · 4 week engagement',
    meta: 'Today · 11:32 AM · CC: Mihir Pawar',
    status: 'Pending',
    tone: 'info',
  },
  {
    id: 'cl-2',
    title: 'EduTrack',
    detail: 'UI Design · 6 week engagement completed',
    meta: 'Jun 18, 2026',
    status: 'Done',
    tone: 'neutral',
  },
]

export const contactLog = [
  {
    id: 'log-1',
    student: 'Riya Kapoor',
    appId: 'ATL-2024-0871',
    context: 'Brand identity · 4 week engagement',
    when: 'Today · 11:32 AM',
    ccd: 'Mihir Pawar',
    status: 'Pending',
    tone: 'info',
    initials: 'RK',
    avatarTone: 'warning',
    mobileMeta: 'Brand identity · 4 weeks · Today',
  },
  {
    id: 'log-2',
    student: 'Arjun Mehta',
    appId: 'ATL-2023-0342',
    context: 'React dev collab · 6 weeks',
    when: 'Jun 18 · 2:10 PM',
    ccd: 'Mihir Pawar',
    status: 'Ongoing',
    tone: 'success',
    initials: 'AM',
    avatarTone: 'success',
    mobileMeta: 'React dev · 6 weeks · Jun 18',
  },
  {
    id: 'log-3',
    student: 'Priya Shah',
    appId: 'ATL-2021-0119',
    context: 'GTM strategy · 2 weeks',
    when: 'Jun 10 · 4:00 PM',
    ccd: 'Mihir Pawar',
    status: 'Done',
    tone: 'neutral',
    initials: 'PS',
    avatarTone: 'neutral',
    mobileMeta: 'GTM · 2 weeks · Jun 10',
  },
]

export const projectFilters = ['All', 'New This Month', 'Featured', 'Hiring']

export const forgeProjects = [
  {
    id: 'novamed',
    name: 'NovaMed',
    initial: 'N',
    tone: 'primary',
    mine: true,
    tags: ['HealthTech', 'Early Traction'],
    description:
      'AI-powered health monitoring app for preventive care. Focused on chronic disease management.',
    teamSize: 4,
    hiring: true,
    mobileMeta: 'Active · Seed stage',
    sector: 'HealthTech',
  },
  {
    id: 'edutrack',
    name: 'EduTrack',
    initial: 'E',
    tone: 'success',
    mine: false,
    tags: ['EdTech', 'Prototype'],
    description:
      'Adaptive learning platform connecting students with personalised content paths.',
    teamSize: 3,
    hiring: true,
    mobileMeta: 'Active · Pre-seed stage',
    sector: 'EdTech',
  },
  {
    id: 'greengrid',
    name: 'GreenGrid',
    initial: 'G',
    tone: 'success',
    mine: false,
    tags: ['CleanTech', 'Idea'],
    description:
      'Peer-to-peer renewable energy trading platform for residential solar users.',
    teamSize: 2,
    hiring: false,
    mobileMeta: 'Active · Idea stage',
    sector: 'CleanTech',
  },
]

export const myStartup = {
  name: 'NovaMed',
  initial: 'NM',
  tagline:
    'AI-powered health monitoring app for preventive care. Focused on chronic disease management.',
  mobileTagline: 'AI-powered preventive health monitoring',
  tags: ['HealthTech', 'Early Traction', 'Actively Hiring'],
  mobileTags: ['HealthTech', 'Seed'],
  stats: [
    { value: '4', label: 'Team Members', tone: 'primary' },
    { value: '3', label: 'Open Roles', tone: 'primary' },
    { value: 'Early Traction', label: 'Stage', tone: 'success' },
    { value: 'Active', label: 'Status', tone: 'success' },
  ],
  mobileStats: [
    { value: '4', label: 'Team', tone: 'primary' },
    { value: '3', label: 'Roles', tone: 'success' },
    { value: 'Active', label: 'Status', tone: 'success' },
  ],
  team: [
    { id: 't1', name: 'Shantanu Ghuriani', shortName: 'Shantanu G.', initials: 'SG', tone: 'primary', role: 'Founder & CEO', shortRole: 'Founder' },
    { id: 't2', name: 'Arjun Mehta', shortName: 'Arjun M.', initials: 'AM', tone: 'success', role: 'CTO', shortRole: 'CTO' },
    { id: 't3', name: 'Priya Shah', shortName: 'Priya S.', initials: 'PS', tone: 'danger', role: 'Head of Design', shortRole: 'Design' },
  ],
}

export const hiringTabs = ['Browse All Roles', 'My Listings', 'My Applications', 'Collabs']

export const listings = [
  {
    id: 'l1',
    title: 'UI/UX Designer',
    company: 'NovaMed',
    type: 'Full-time',
    status: 'Pending Approval',
    tone: 'warning',
    skills: ['Design', 'Mobile', 'Figma'],
    detailMeta: 'NovaMed · Full-time · Posted today',
    description:
      "We're looking for a talented product designer to lead the mobile app redesign for our health monitoring platform. You'll own the full design process from research to final handoff.",
    detailSkills: ['Design', 'Mobile', 'Figma', 'UX Research'],
  },
  {
    id: 'l2',
    title: 'Frontend Developer',
    company: 'EduTrack',
    type: 'Part-time',
    status: 'Live',
    tone: 'success',
    skills: ['React', 'TypeScript'],
    detailMeta: 'EduTrack · Part-time · Posted Jun 18',
    description:
      'Build the adaptive learning experience used by thousands of students each week.',
    detailSkills: ['React', 'TypeScript', 'Testing'],
  },
  {
    id: 'l3',
    title: 'Marketing Lead',
    company: 'NovaMed',
    type: 'Contract',
    status: 'Live',
    tone: 'success',
    skills: ['GTM', 'Content'],
    detailMeta: 'NovaMed · Contract · Posted Jun 12',
    description:
      'Own go-to-market for the NovaMed launch — positioning, content and early growth experiments.',
    detailSkills: ['GTM', 'Content', 'Analytics'],
  },
]

export const mobileListings = [
  { id: 'ml1', title: 'UI/UX Designer', meta: 'Full-time · NovaMed', status: 'Live', tone: 'success' },
  { id: 'ml2', title: 'Frontend Dev', meta: 'Part-time · NovaMed', status: 'Pending', tone: 'warning' },
  { id: 'ml3', title: 'Marketing Lead', meta: 'Contract · NovaMed', status: 'Live', tone: 'success' },
  { id: 'ml4', title: 'Data Analyst', meta: 'Part-time · NovaMed', status: 'Pending', tone: 'warning' },
]

export const applicants = [
  { id: 'a1', name: 'Riya Kapoor', initials: 'RK', tone: 'primary', meta: 'BDes · 3rd Year' },
  { id: 'a2', name: 'Anjali Rao', initials: 'AR', tone: 'primary', meta: 'BDes · 2nd Year' },
  { id: 'a3', name: 'Dev Malhotra', initials: 'DM', tone: 'primary', meta: 'BTech · 3rd Year' },
]

export const contractTypes = ['Collaboration / No Pay', 'Paid Freelance', 'Equity / Revenue Share']
export const industries = ['HealthTech', 'EdTech', 'CleanTech', 'Other']
export const stages = ['Idea', 'Prototype', 'Early Traction']
export const hiringStatuses = ['Actively Hiring', 'Not Hiring']

export const mentor = {
  name: 'Mihir Pawar',
  initials: 'MP',
  role: 'Forge Manager · Primary Mentor for all incubated projects',
  note: 'Faculty, Alumni, and Industry mentors available for special project needs',
  mobileRole: 'Forge Manager · Mentor',
}

export const mentorSessions = [
  {
    id: 'f-ses-1',
    when: 'Thu, 24 Jul · 3:00 PM',
    status: 'Upcoming',
    statusTone: 'info',
    mentor: 'Mentor: Mihir Pawar',
    topic: 'Product-market fit strategy for NovaMed Q3 launch',
  },
  {
    id: 'f-ses-2',
    when: 'Mon, 14 Jul · 11:00 AM',
    status: 'Completed',
    statusTone: 'success',
    mentor: 'Mentor: Mihir Pawar',
    topic: 'Reviewed pitch deck. Feedback on financial projections.',
  },
  {
    id: 'f-ses-3',
    when: 'Pending Assignment',
    status: 'Requested',
    statusTone: 'warning',
    mentor: 'Mentor: TBD',
    topic: 'UX guidance for onboarding flow — requested Faculty mentor',
  },
]

export const mobileUpcomingSession = {
  title: 'Startup Review — NovaMed',
  when: 'Thu 27 Jul · 3:00 PM',
}

export const incubationDraft = {
  title: 'NovaMed — Draft',
  meta: 'Last edited 2 days ago · 60% complete',
}
