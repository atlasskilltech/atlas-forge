/**
 * Mock content for the Backend Manager module, transcribed from the Figma
 * references. Replaced by API calls when the backend section is built.
 */

export const dashboardStats = [
  { value: '18', label: 'Total Users', tone: 'primary' },
  { value: '5', label: 'Active Startups', tone: 'success' },
  { value: '7', label: 'Pending Approvals', tone: 'warning' },
  { value: '3', label: 'Open Incubations', tone: 'success' },
  { value: '0', label: 'Platform Errors', tone: 'neutral' },
]

export const mobileDashboardStats = [
  { value: '17', label: 'Users', tone: 'danger' },
  { value: '7', label: 'Pending', tone: 'warning' },
  { value: '14', label: 'Jobs', tone: 'success' },
  { value: '3', label: 'Startups', tone: 'primary' },
]

export const quickAccessControls = [
  { label: 'Grant Founder Access', href: '/backend/grant-access', variant: 'primary' },
  { label: 'Revoke Access', href: '/backend/revoke-access', variant: 'danger' },
  { label: 'Review Job Queue', href: '/backend/job-queue', variant: 'secondary' },
  { label: 'Platform Settings', href: '/backend/settings', variant: 'secondary' },
]

export const mobileQuickActions = [
  { label: 'All Users', href: '/backend/users', primary: true },
  { label: 'Job Queue', href: '/backend/job-queue' },
  { label: 'Settings', href: '/backend/settings' },
]

export const platformActivity = [
  {
    id: 'pa-1',
    title: 'Founder access granted to Shantanu Ghuriani',
    meta: 'By Mihir Pawar · Today · 9:12 AM',
    dot: 'success',
  },
  {
    id: 'pa-2',
    title: "Job listing rejected: 'Unrelated to incubation'",
    meta: 'By Mihir Pawar · Today · 8:55 AM',
    dot: 'danger',
  },
  {
    id: 'pa-3',
    title: 'New incubation application: GreenGrid',
    meta: 'By Priya Shah · Yesterday · 5:30 PM',
    dot: 'primary',
  },
  {
    id: 'pa-4',
    title: 'Contact logged: Riya Kapoor → NovaMed',
    meta: 'By Shantanu G. · Yesterday · 2:15 PM',
    dot: 'neutral',
  },
]

export const userFilters = ['All', 'Students', 'Founders', 'Managers', 'Inactive']

export const userCounts = [
  { label: '12 Students', tone: 'info' },
  { label: '3 Founders', tone: 'success' },
  { label: '2 Managers', tone: 'warning' },
]

export const allUsers = [
  { id: 'bu-1', name: 'Shantanu Ghuriani', initials: 'SG', tone: 'dark', appId: 'ATL-2022-0012', role: 'Backend Manager', group: 'Managers', startup: '—', status: 'Active', statusTone: 'success', lastActive: '1 min ago' },
  { id: 'bu-2', name: 'Mihir Pawar', initials: 'MP', tone: 'dark', appId: 'ATL-2020-0001', role: 'Forge Manager', group: 'Managers', startup: '—', status: 'Active', statusTone: 'success', lastActive: '5 min ago' },
  { id: 'bu-3', name: 'Riya Kapoor', initials: 'RK', tone: 'primary', appId: 'ATL-2024-0871', role: 'Founder Unlocked', group: 'Founders', startup: 'NovaMed', status: 'Active', statusTone: 'success', lastActive: 'Today' },
  { id: 'bu-4', name: 'Arjun Mehta', initials: 'AM', tone: 'success', appId: 'ATL-2023-0342', role: 'Founder Unlocked', group: 'Founders', startup: 'EduTrack', status: 'Active', statusTone: 'success', lastActive: 'Today' },
  { id: 'bu-5', name: 'Priya Shah', initials: 'PS', tone: 'danger', appId: 'ATL-2021-0119', role: 'Student — Standard', group: 'Students', startup: '—', status: 'Active', statusTone: 'success', lastActive: 'Yesterday' },
  { id: 'bu-6', name: 'Vivaan Nair', initials: 'VN', tone: 'warning', appId: 'ATL-2025-0988', role: 'Student — Standard', group: 'Students', startup: '—', status: 'Active', statusTone: 'success', lastActive: 'Jun 24' },
  { id: 'bu-7', name: 'Kavya Reddy', initials: 'KR', tone: 'neutral', appId: 'ATL-2023-0541', role: 'Student — Standard', group: 'Students', startup: '—', status: 'Inactive', statusTone: 'neutral', lastActive: 'Jun 10' },
]

export const queueTabs = ['All Pending', 'Job Listings', 'Collab Posts', 'Approved', 'Rejected']

export const jobQueue = [
  { id: 'bq-1', kind: 'Job', title: 'UI/UX Designer', startup: 'NovaMed', by: 'Shantanu G.', date: 'Today', decision: 'Pending', tone: 'warning' },
  { id: 'bq-2', kind: 'Job', title: 'Frontend Developer', startup: 'EduTrack', by: 'Arjun M.', date: 'Yesterday', decision: 'Approved', tone: 'success' },
  { id: 'bq-3', kind: 'Collab', title: 'Brand Collab Needed', startup: 'GreenGrid', by: 'Priya S.', date: 'Jun 21', decision: 'Pending', tone: 'warning' },
  { id: 'bq-4', kind: 'Job', title: 'Data Analyst', startup: 'EduTrack', by: 'Arjun M.', date: 'Jun 19', decision: 'Pending', tone: 'warning' },
  { id: 'bq-5', kind: 'Job', title: 'Backend Developer', startup: 'NovaMed', by: 'Shantanu G.', date: 'Jun 15', decision: 'Rejected', tone: 'danger' },
]

export const matchedStudent = {
  name: 'Priya Shah',
  initials: 'PS',
  tone: 'primary',
  meta: 'BBA · 4th Year · ATL-2021-0119 · Current role: Standard Student',
  startup: 'GreenGrid',
}

export const foundersWithAccess = [
  { id: 'fa-1', name: 'Shantanu Ghuriani', initials: 'SG', tone: 'primary', appId: 'ATL-2022-0012', startup: 'NovaMed', granted: 'Granted by Mihir Pawar · Jan 12, 2026' },
  { id: 'fa-2', name: 'Arjun Mehta', initials: 'AM', tone: 'primary', appId: 'ATL-2023-0342', startup: 'EduTrack', granted: 'Granted by Mihir Pawar · Mar 5, 2026' },
  { id: 'fa-3', name: 'Priya Shah (pending)', initials: 'PS', tone: 'primary', appId: 'ATL-2021-0119', startup: 'GreenGrid', granted: 'Granted by — · Pending' },
]

export const mobileRoleAssignments = [
  { id: 'mr-1', name: 'Riya Kapoor', initials: 'RK', tone: 'primary', role: 'Founder Unlocked' },
  { id: 'mr-2', name: 'Arjun Mehta', initials: 'AM', tone: 'success', role: 'Founder Unlocked' },
  { id: 'mr-3', name: 'Priya Shah', initials: 'PS', tone: 'danger', role: 'Standard Student' },
  { id: 'mr-4', name: 'Vivaan Nair', initials: 'VN', tone: 'warning', role: 'Standard Student' },
  { id: 'mr-5', name: 'Kavya Reddy', initials: 'KR', tone: 'neutral', role: 'Standard Student' },
]

export const settingsGroups = [
  {
    label: 'General',
    items: [
      { id: 'platform-name', title: 'Platform Name', detail: 'ATLAS Forge', control: 'edit' },
      { id: 'university', title: 'University', detail: 'ATLAS SkillTech University', control: 'none' },
      { id: 'v1-mode', title: 'V1 Mode (Internal Only)', detail: 'Enabled', control: 'toggle', on: true },
    ],
  },
  {
    label: 'Access & Roles',
    items: [
      { id: 'self-reg', title: 'Student Self-Registration', detail: 'Disabled — App ID required', control: 'toggle', on: false },
      { id: 'auto-approve', title: 'Founder Access Auto-Approval', detail: 'Disabled — Manual by Forge Manager', control: 'toggle', on: false },
      { id: 'external', title: 'External Access (V2)', detail: 'Disabled', control: 'toggle', on: false },
    ],
  },
  {
    label: 'Content Moderation',
    items: [
      { id: 'job-approval', title: 'Job Listings require approval', detail: 'Enabled', control: 'toggle', on: true },
      { id: 'collab-approval', title: 'Collab Posts require approval', detail: 'Enabled', control: 'toggle', on: true },
      { id: 'contact-cc', title: 'Contact Log auto-CC', detail: 'Enabled — Forge Manager CC’d', control: 'toggle', on: true },
    ],
  },
]

export const mobileSettings = [
  { id: 'v1-mode', title: 'V1 Mode', detail: 'Enabled', on: true },
  { id: 'self-reg', title: 'Self-Registration', detail: 'Disabled', on: false },
  { id: 'job-approval', title: 'Job Approval', detail: 'Required', on: true },
  { id: 'contact-cc', title: 'Contact Log CC', detail: 'Enabled', on: true },
]

export const platformLogs = [
  { id: 'lg-1', time: 'Today 11:32 AM', actor: 'Shantanu G.', action: 'Contacted Riya Kapoor via Concierge', module: 'Concierge', status: 'Logged', tone: 'success' },
  { id: 'lg-2', time: 'Today 09:12 AM', actor: 'Mihir Pawar', action: 'Granted Founder access: Shantanu Ghuriani', module: 'Access', status: 'Success', tone: 'success' },
  { id: 'lg-3', time: 'Today 08:55 AM', actor: 'Mihir Pawar', action: "Rejected Job Listing: 'Off-topic role'", module: 'Hiring', status: 'Action', tone: 'warning' },
  { id: 'lg-4', time: 'Yesterday 5:30 PM', actor: 'Priya Shah', action: 'Submitted incubation application: GreenGrid', module: 'Incubation', status: 'Pending', tone: 'info' },
  { id: 'lg-5', time: 'Yesterday 3:14 PM', actor: 'Mihir Pawar', action: 'Approved Job Listing: UI/UX Designer', module: 'Hiring', status: 'Success', tone: 'success' },
  { id: 'lg-6', time: 'Jun 20 4:00 PM', actor: 'Riya Kapoor', action: 'Requested mentorship session', module: 'Mentorship', status: 'Pending', tone: 'info' },
  { id: 'lg-7', time: 'Jun 18 2:10 PM', actor: 'Shantanu G.', action: 'Contacted Priya Shah via Concierge', module: 'Concierge', status: 'Logged', tone: 'success' },
  { id: 'lg-8', time: 'Jun 15 10:00 AM', actor: 'Shantanu G.', action: 'Posted Job: Frontend Developer', module: 'Hiring', status: 'Pending Approval', tone: 'warning' },
]

export const sharedProfile = {
  name: 'Shantanu Ghuriani',
  initials: 'SG',
  email: 'shantanughuriani@gmail.com',
  appId: 'ATL-2022-0012',
  roles: ['Backend Manager', 'Founder — NovaMed'],
  access: ['Backend Manager', 'Founder Unlocked'],
  mobileRole: 'Backend Manager · Founder',
}
