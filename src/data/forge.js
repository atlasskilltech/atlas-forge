/**
 * Mock content for the Forge Manager module, transcribed from the Figma
 * references. Replaced by API calls when the backend section is built.
 */

export const dashboardStats = [
  { value: '12', label: 'Total Students', tone: 'primary' },
  { value: '5', label: 'Pending Approvals', tone: 'warning' },
  { value: '3', label: 'Active Startups', tone: 'success' },
  { value: '7', label: 'Jobs in Queue', tone: 'primary' },
  { value: '2', label: 'Mentor Requests', tone: 'primary' },
]

export const mobileDashboardStats = [
  { value: '7', label: 'Pending', tone: 'warning' },
  { value: '12', label: 'Students', tone: 'primary' },
  { value: '3', label: 'Startups', tone: 'success' },
  { value: '5', label: 'Jobs', tone: 'success' },
]

export const mobileQuickActions = [
  { label: 'Review Queue', href: '/forge/approval-queue', primary: true },
  { label: 'Student Pool', href: '/forge/student-pool' },
  { label: 'Assign Mentor', href: '/forge/assign-mentors' },
]

export const dashboardQueue = [
  {
    id: 'dq-1',
    initial: 'J',
    tone: 'warning',
    title: 'UI/UX Designer — NovaMed',
    meta: 'Job Listing · Shantanu G. · Today',
  },
  {
    id: 'dq-2',
    initial: 'J',
    tone: 'warning',
    title: 'Frontend Dev — EduTrack',
    meta: 'Job Listing · Arjun M. · Yesterday',
  },
  {
    id: 'dq-3',
    initial: 'C',
    tone: 'primary',
    title: 'Brand Collab — GreenGrid',
    meta: 'Collab Post · Priya S. · Jun 21',
  },
  {
    id: 'dq-4',
    initial: 'M',
    tone: 'success',
    title: 'UX Mentor request — Riya K.',
    meta: 'Mentorship · Faculty needed · Jun 20',
  },
]

export const mobilePending = [
  { id: 'mp-1', title: 'UI/UX Designer', meta: 'NovaMed · Job Listing', status: 'Pending' },
  { id: 'mp-2', title: 'Brand Collab', meta: 'GreenGrid · Collab', status: 'Pending' },
]

export const dashboardContacts = [
  {
    id: 'dc-1',
    title: 'Shantanu G. → Riya Kapoor',
    meta: 'Brand identity · 4 weeks · Today · 11:32 AM',
    status: 'Pending',
    tone: 'info',
  },
  {
    id: 'dc-2',
    title: 'Arjun M. → Vivaan Nair',
    meta: 'React dev · 6 weeks · Yesterday · 2:10 PM',
    status: 'Ongoing',
    tone: 'success',
  },
  {
    id: 'dc-3',
    title: 'Shantanu G. → Priya Shah',
    meta: 'GTM strategy · 2 weeks · Jun 18',
    status: 'Done',
    tone: 'neutral',
  },
]

export const approvalTabs = [
  'All (7)',
  'Job Listings (5)',
  'Collab Posts (2)',
  'Approved',
  'Rejected',
]

export const approvalQueue = [
  {
    id: 'aq-1',
    initial: 'J',
    tone: 'warning',
    title: 'UI/UX Designer',
    meta: 'NovaMed · Full-time · Shantanu G.',
    mobileMeta: 'NovaMed · Job Listing',
    skills: ['Design', 'Mobile'],
    kind: 'Job Listings (5)',
    status: 'Pending',
  },
  {
    id: 'aq-2',
    initial: 'J',
    tone: 'warning',
    title: 'Frontend Developer',
    mobileTitle: 'Frontend Dev',
    meta: 'EduTrack · Part-time · Arjun M.',
    mobileMeta: 'NovaMed · Job Listing',
    skills: ['React', 'TypeScript'],
    kind: 'Job Listings (5)',
    status: 'Pending',
  },
  {
    id: 'aq-3',
    initial: 'J',
    tone: 'warning',
    title: 'Marketing Lead',
    meta: 'NovaMed · Contract · Shantanu G.',
    mobileMeta: 'NovaMed · Job Listing',
    skills: ['GTM', 'Content'],
    kind: 'Job Listings (5)',
    status: 'Approved',
  },
  {
    id: 'aq-4',
    initial: 'C',
    tone: 'primary',
    title: 'Brand Collab — GreenGrid',
    mobileTitle: 'Brand Collab',
    meta: 'Collab · Priya S. · No pay',
    mobileMeta: 'NovaMed · Job Listing',
    skills: ['Branding'],
    kind: 'Collab Posts (2)',
    status: 'Pending',
  },
  {
    id: 'aq-5',
    initial: 'J',
    tone: 'warning',
    title: 'Data Analyst',
    meta: 'EduTrack · Part-time · Arjun M.',
    mobileMeta: 'NovaMed · Job Listing',
    skills: ['SQL', 'Python'],
    kind: 'Job Listings (5)',
    status: 'Pending',
  },
]

export const poolFilters = ['All', 'Design', 'Tech', 'Business', 'Available Now']

export const students = [
  {
    id: 'riya',
    name: 'Riya Kapoor',
    initials: 'RK',
    tone: 'primary',
    meta: 'BDes · 3rd Year · ATL-2024-0871',
    detailMeta: 'BDes Product Design · 3rd Year · ATL-2024-0871',
    mobileMeta: 'BDes · UI/UX · Available',
    appId: 'ATL-2024-0871',
    skills: ['UI/UX', 'Branding'],
    detailSkills: ['UI/UX', 'Branding', 'Figma'],
    available: true,
    track: 'Design',
    stats: [
      { value: '10 hrs', label: 'Per week', tone: 'ink' },
      { value: '3', label: 'Engagements', tone: 'primary' },
      { value: '2', label: 'Projects done', tone: 'primary' },
    ],
  },
  {
    id: 'arjun',
    name: 'Arjun Mehta',
    initials: 'AM',
    tone: 'success',
    meta: 'BTech · 2nd Year · ATL-2023-0342',
    detailMeta: 'BTech Computer Science · 2nd Year · ATL-2023-0342',
    mobileMeta: 'BTech · React · 15hrs/wk',
    appId: 'ATL-2023-0342',
    skills: ['React', 'Node.js'],
    detailSkills: ['React', 'Node.js', 'TypeScript'],
    available: true,
    track: 'Tech',
    stats: [
      { value: '15 hrs', label: 'Per week', tone: 'ink' },
      { value: '1', label: 'Engagements', tone: 'primary' },
      { value: '2', label: 'Projects done', tone: 'primary' },
    ],
  },
  {
    id: 'priya',
    name: 'Priya Shah',
    initials: 'PS',
    tone: 'danger',
    meta: 'BBA · 4th Year · ATL-2021-0119',
    detailMeta: 'BBA Marketing · 4th Year · ATL-2021-0119',
    mobileMeta: 'BBA · Marketing · Weekends',
    appId: 'ATL-2021-0119',
    skills: ['Marketing', 'GTM'],
    detailSkills: ['Marketing', 'GTM', 'Content'],
    available: false,
    track: 'Business',
    stats: [
      { value: '8 hrs', label: 'Per week', tone: 'ink' },
      { value: '3', label: 'Engagements', tone: 'primary' },
      { value: '4', label: 'Projects done', tone: 'primary' },
    ],
  },
  {
    id: 'vivaan',
    name: 'Vivaan Nair',
    initials: 'VN',
    tone: 'warning',
    meta: 'BTech · 1st Year · ATL-2025-0988',
    detailMeta: 'BTech Data Science · 1st Year · ATL-2025-0988',
    mobileMeta: 'BTech · ML · Flexible',
    appId: 'ATL-2025-0988',
    skills: ['Python', 'ML'],
    detailSkills: ['Python', 'ML', 'Analytics'],
    available: true,
    track: 'Tech',
    stats: [
      { value: '12 hrs', label: 'Per week', tone: 'ink' },
      { value: '1', label: 'Engagements', tone: 'primary' },
      { value: '1', label: 'Projects done', tone: 'primary' },
    ],
  },
]

export const mentorRequests = [
  {
    id: 'mr-1',
    initials: 'RK',
    tone: 'primary',
    title: 'Riya Kapoor — NovaMed',
    detail: 'UX guidance for onboarding flow',
    kind: 'Faculty Mentor',
    kindTone: 'success',
  },
  {
    id: 'mr-2',
    initials: 'AM',
    tone: 'primary',
    title: 'Arjun Mehta — EduTrack',
    detail: 'Backend architecture review',
    kind: 'Industry Mentor',
    kindTone: 'success',
  },
]

export const sessionLog = [
  {
    id: 'sl-1',
    title: 'Shantanu G. with Mihir Pawar',
    meta: 'PMF strategy for NovaMed · Thu, 24 Jul · 3PM',
    status: 'Upcoming',
    tone: 'info',
  },
  {
    id: 'sl-2',
    title: 'Arjun M. with Mihir Pawar',
    meta: 'Backend architecture review · Mon, 14 Jul',
    status: 'Completed',
    tone: 'success',
  },
  {
    id: 'sl-3',
    title: 'Riya K. with Dr. Meera Joshi (Faculty)',
    meta: 'UX Research methods · Pending',
    status: 'Requested',
    tone: 'warning',
  },
  {
    id: 'sl-4',
    title: 'Priya S. with Rahul Nair (Alumni)',
    meta: 'GTM strategy workshop · Jun 10',
    status: 'Completed',
    tone: 'success',
  },
]

export const mentors = [
  {
    id: 'rahul',
    name: 'Rahul Nair',
    short: 'Rahul',
    initials: 'RN',
    kind: 'Alumni Mentor',
    skills: ['GTM Strategy', 'Fundraising'],
  },
  {
    id: 'meera',
    name: 'Dr. Meera Joshi',
    short: 'Dr. Meera',
    initials: 'MJ',
    kind: 'Faculty Mentor',
    skills: ['UX Research', 'Product Strategy'],
  },
  {
    id: 'ananya',
    name: 'Ananya Iyer',
    short: 'Ananya',
    initials: 'AI',
    kind: 'Industry Mentor',
    skills: ['Backend Architecture', 'Cloud Infra'],
  },
  {
    id: 'karan',
    name: 'Karan Malhotra',
    short: 'Karan',
    initials: 'KM',
    kind: 'Industry Mentor',
    skills: ['UI Design', 'Branding'],
  },
  {
    id: 'priya-d',
    name: 'Priya Deshmukh',
    short: 'Priya',
    initials: 'PD',
    kind: 'Faculty Mentor',
    skills: ['Legal & Compliance', 'IP Strategy'],
  },
  {
    id: 'sanjay',
    name: 'Sanjay Verma',
    short: 'Sanjay',
    initials: 'SV',
    kind: 'Alumni Mentor',
    skills: ['Growth', 'Analytics'],
  },
]

export const mobileMentorAssignments = [
  {
    id: 'ma-1',
    initials: 'RK',
    tone: 'primary',
    name: 'Riya Kapoor',
    meta: 'UI/UX · Unassigned',
    assigned: false,
  },
  {
    id: 'ma-2',
    initials: 'AM',
    tone: 'success',
    name: 'Arjun Mehta',
    meta: 'React · Assigned',
    assigned: true,
    assignedTo: 'NovaMed',
  },
  {
    id: 'ma-3',
    initials: 'PS',
    tone: 'danger',
    name: 'Priya Shah',
    meta: 'Marketing · Unassigned',
    assigned: false,
  },
]

export const incubationApplications = [
  {
    id: 'ia-1',
    name: 'NovaMed',
    founder: 'Shantanu Ghuriani',
    stage: 'Early Traction',
    status: 'Active',
    tone: 'success',
  },
  {
    id: 'ia-2',
    name: 'EduTrack',
    founder: 'Arjun Mehta',
    stage: 'Prototype',
    status: 'Under Review',
    tone: 'warning',
  },
  {
    id: 'ia-3',
    name: 'GreenGrid',
    founder: 'Priya Shah',
    stage: 'Idea',
    status: 'Pending',
    tone: 'info',
  },
]

export const listingFilters = [
  'All',
  'Live',
  'Pending Approval',
  'Rejected',
  'Job Listing',
  'Collab Post',
]

export const allListings = [
  { id: 'al-1', title: 'UI/UX Designer', startup: 'NovaMed', type: 'Full-time', by: 'Shantanu G.', date: 'Today', status: 'Live', tone: 'success' },
  { id: 'al-2', title: 'Frontend Dev', startup: 'EduTrack', type: 'Part-time', by: 'Arjun M.', date: 'Yesterday', status: 'Pending', tone: 'warning' },
  { id: 'al-3', title: 'Marketing Lead', startup: 'NovaMed', type: 'Contract', by: 'Shantanu G.', date: 'Jun 19', status: 'Live', tone: 'success' },
  { id: 'al-4', title: 'Brand Collab', startup: 'GreenGrid', type: 'Collab', by: 'Priya S.', date: 'Jun 18', status: 'Live', tone: 'success' },
  { id: 'al-5', title: 'Data Analyst', startup: 'EduTrack', type: 'Part-time', by: 'Arjun M.', date: 'Jun 15', status: 'Pending', tone: 'warning' },
  { id: 'al-6', title: 'Backend Dev', startup: 'NovaMed', type: 'Full-time', by: 'Shantanu G.', date: 'Jun 12', status: 'Rejected', tone: 'danger' },
]

export const listingCounts = [
  { label: '5 Live', tone: 'success' },
  { label: '7 Pending', tone: 'warning' },
  { label: '2 Rejected', tone: 'danger' },
]

export const projectFilters = ['All', 'HealthTech', 'EdTech', 'CleanTech', 'Hiring', 'Featured']

export const allProjects = [
  {
    id: 'novamed',
    name: 'NovaMed',
    initial: 'N',
    tone: 'primary',
    status: 'Active',
    statusTone: 'success',
    tags: ['HealthTech', 'Early Traction'],
    founder: 'Shantanu G.',
    team: 4,
    openRoles: 3,
    sector: 'HealthTech',
    featured: true,
  },
  {
    id: 'edutrack',
    name: 'EduTrack',
    initial: 'E',
    tone: 'success',
    status: 'Active',
    statusTone: 'success',
    tags: ['EdTech', 'Prototype'],
    founder: 'Arjun M.',
    team: 3,
    openRoles: 2,
    sector: 'EdTech',
    featured: false,
  },
  {
    id: 'greengrid',
    name: 'GreenGrid',
    initial: 'G',
    tone: 'success',
    status: 'Pending',
    statusTone: 'warning',
    tags: ['CleanTech', 'Idea'],
    founder: 'Priya S.',
    team: 2,
    openRoles: 0,
    sector: 'CleanTech',
    featured: false,
  },
]

export const contactStats = [
  { value: '7', label: 'Total Contacts', tone: 'primary' },
  { value: '2', label: 'This Week', tone: 'primary' },
  { value: '3', label: 'Ongoing', tone: 'success' },
  { value: '2', label: 'Completed', tone: 'primary' },
]

export const allContacts = [
  { id: 'ac-1', founder: 'Shantanu G.', student: 'Riya Kapoor', context: 'Brand identity · 4 week eng.', date: 'Today 11:32 AM', ccd: 'Mihir Pawar', status: 'Pending', tone: 'info' },
  { id: 'ac-2', founder: 'Arjun M.', student: 'Vivaan Nair', context: 'React dev · 6 weeks', date: 'Yesterday 2:10 PM', ccd: 'Mihir Pawar', status: 'Ongoing', tone: 'success' },
  { id: 'ac-3', founder: 'Shantanu G.', student: 'Priya Shah', context: 'GTM strategy · 2 weeks', date: 'Jun 18 4:00 PM', ccd: 'Mihir Pawar', status: 'Done', tone: 'neutral' },
  { id: 'ac-4', founder: 'Arjun M.', student: 'Riya Kapoor', context: 'UX collab · 3 weeks', date: 'Jun 15 10:00 AM', ccd: 'Mihir Pawar', status: 'Ongoing', tone: 'success' },
  { id: 'ac-5', founder: 'Shantanu G.', student: 'Vivaan Nair', context: 'ML research · 4 weeks', date: 'Jun 10 3:30 PM', ccd: 'Mihir Pawar', status: 'Done', tone: 'neutral' },
]

/** No frame exists for Posted Needs / Platform Logs — see the route files. */
export const postedNeeds = [
  {
    id: 'pn-1',
    title: 'UI Designer for patient onboarding',
    meta: 'NovaMed · Shantanu G. · Posted today',
    status: 'Open',
    tone: 'success',
  },
  {
    id: 'pn-2',
    title: 'React developer for adaptive learning module',
    meta: 'EduTrack · Arjun M. · Posted Jun 18',
    status: 'Open',
    tone: 'success',
  },
  {
    id: 'pn-3',
    title: 'Brand identity collaborator',
    meta: 'GreenGrid · Priya S. · Posted Jun 12',
    status: 'Filled',
    tone: 'neutral',
  },
]

export const platformLogs = [
  {
    id: 'pl-1',
    title: 'Founder access granted to Shantanu Ghuriani',
    meta: 'By Mihir Pawar · Today · 9:12 AM',
    status: 'Granted',
    tone: 'success',
    dot: 'success',
  },
  {
    id: 'pl-2',
    title: "Job listing rejected: 'Unrelated to incubation'",
    meta: 'By Mihir Pawar · Today · 8:55 AM',
    status: 'Rejected',
    tone: 'danger',
    dot: 'danger',
  },
  {
    id: 'pl-3',
    title: 'New incubation application: GreenGrid',
    meta: 'By Priya Shah · Yesterday · 5:30 PM',
    status: 'Pending',
    tone: 'info',
    dot: 'primary',
  },
  {
    id: 'pl-4',
    title: 'Contact logged: Riya Kapoor → NovaMed',
    meta: 'By Shantanu G. · Yesterday · 2:15 PM',
    status: 'Done',
    tone: 'neutral',
    dot: 'primary',
  },
]

export const userFilters = ['All', 'Students', 'Founders', 'Managers']

export const userAccounts = [
  { id: 'ua-1', name: 'Shantanu Ghuriani', short: 'Shantanu G.', initials: 'SG', tone: 'dark', appId: 'ATL-2022-0012', role: 'Backend Manager', group: 'Managers', status: 'Active', tone2: 'success' },
  { id: 'ua-2', name: 'Mihir Pawar', short: 'Mihir Pawar', initials: 'MP', tone: 'warning', appId: 'ATL-2020-0001', role: 'Forge Manager', group: 'Managers', status: 'Active', tone2: 'success' },
  { id: 'ua-3', name: 'Riya Kapoor', short: 'Riya Kapoor', initials: 'RK', tone: 'primary', appId: 'ATL-2024-0871', role: 'Founder Unlocked', group: 'Founders', status: 'Active', tone2: 'success', mobileRole: 'Founder · NovaMed' },
  { id: 'ua-4', name: 'Arjun Mehta', short: 'Arjun Mehta', initials: 'AM', tone: 'success', appId: 'ATL-2023-0342', role: 'Founder Unlocked', group: 'Founders', status: 'Active', tone2: 'success', mobileRole: 'Founder · EduTrack' },
  { id: 'ua-5', name: 'Priya Shah', short: 'Priya Shah', initials: 'PS', tone: 'danger', appId: 'ATL-2021-0119', role: 'Student - Standard', group: 'Students', status: 'Active', tone2: 'success', mobileRole: 'Standard Student' },
  { id: 'ua-6', name: 'Vivaan Nair', short: 'Vivaan Nair', initials: 'VN', tone: 'primary', appId: 'ATL-2025-0988', role: 'Student - Standard', group: 'Students', status: 'Active', tone2: 'success', mobileRole: 'Standard Student' },
  { id: 'ua-7', name: 'Kavya Reddy', short: 'Kavya Reddy', initials: 'KR', tone: 'primary', appId: 'ATL-2023-0541', role: 'Student - Standard', group: 'Students', status: 'Inactive', tone2: 'neutral', mobileRole: 'Standard Student' },
]
