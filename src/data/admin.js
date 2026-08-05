/**
 * Mock content for the Super Admin (view-only) module, transcribed from the
 * Figma references. Every screen in this role is read-only.
 */

export const overviewStats = [
  { value: '18', label: 'Total Users', tone: 'primary' },
  { value: '5', label: 'Active Startups', tone: 'success' },
  { value: '12', label: 'Live Job Listings', tone: 'success' },
  { value: '8', label: 'Mentor Sessions', tone: 'success' },
  { value: '3', label: 'Pending Incubations', tone: 'warning' },
]

export const mobileOverviewStats = [
  { value: '17', label: 'Users', tone: 'primary' },
  { value: '3', label: 'Startups', tone: 'success' },
  { value: '14', label: 'Jobs', tone: 'success' },
  { value: '7', label: 'Pending', tone: 'warning' },
]

export const overviewStartups = [
  { id: 'ov-1', name: 'NovaMed', founder: 'Shantanu Ghuriani', stage: 'Early Traction', status: 'Active', tone: 'success', openRoles: '3 open', mentor: 'Mihir Pawar' },
  { id: 'ov-2', name: 'EduTrack', founder: 'Arjun Mehta', stage: 'Prototype', status: 'Active', tone: 'success', openRoles: '2 open', mentor: 'Mihir Pawar' },
  { id: 'ov-3', name: 'GreenGrid', founder: 'Priya Shah', stage: 'Idea', status: 'Pending', tone: 'warning', openRoles: '0 open', mentor: 'Unassigned' },
]

export const userFilters = ['All', 'Students', 'Founders', 'Managers']

export const userCounts = [
  { label: '12 Students', tone: 'info' },
  { label: '3 Founders', tone: 'success' },
  { label: '2 Managers', tone: 'warning' },
]

export const users = [
  { id: 'su-1', name: 'Shantanu Ghuriani', short: 'Shantanu G.', initials: 'SG', tone: 'dark', appId: 'ATL-2022-0012', role: 'Backend Manager', group: 'Managers', startup: '—', status: 'Active', statusTone: 'success', lastActive: '1 min ago' },
  { id: 'su-2', name: 'Mihir Pawar', short: 'Mihir Pawar', initials: 'MP', tone: 'warning', appId: 'ATL-2020-0001', role: 'Forge Manager', group: 'Managers', startup: '—', status: 'Active', statusTone: 'success', lastActive: '5 min ago' },
  { id: 'su-3', name: 'Riya Kapoor', short: 'Riya Kapoor', initials: 'RK', tone: 'primary', appId: 'ATL-2024-0871', role: 'Founder Unlocked', mobileRole: 'Founder', group: 'Founders', startup: 'NovaMed', status: 'Active', statusTone: 'success', lastActive: 'Today' },
  { id: 'su-4', name: 'Arjun Mehta', short: 'Arjun Mehta', initials: 'AM', tone: 'success', appId: 'ATL-2023-0342', role: 'Founder Unlocked', mobileRole: 'Founder', group: 'Founders', startup: 'EduTrack', status: 'Active', statusTone: 'success', lastActive: 'Today' },
  { id: 'su-5', name: 'Priya Shah', short: 'Priya Shah', initials: 'PS', tone: 'danger', appId: 'ATL-2021-0119', role: 'Student — Standard', mobileRole: 'Student', group: 'Students', startup: '—', status: 'Active', statusTone: 'success', lastActive: 'Yesterday' },
  { id: 'su-6', name: 'Vivaan Nair', short: 'Vivaan Nair', initials: 'VN', tone: 'warning', appId: 'ATL-2025-0988', role: 'Student — Standard', mobileRole: 'Student', group: 'Students', startup: '—', status: 'Active', statusTone: 'success', lastActive: 'Jun 24' },
  { id: 'su-7', name: 'Kavya Reddy', short: 'Kavya Reddy', initials: 'KR', tone: 'neutral', appId: 'ATL-2023-0541', role: 'Student — Standard', mobileRole: 'Student', group: 'Students', startup: '—', status: 'Inactive', statusTone: 'neutral', lastActive: 'Jun 10' },
]

export const startupStats = [
  { value: '5', label: 'Total Startups', tone: 'primary' },
  { value: '3', label: 'Active', tone: 'success' },
  { value: '1', label: 'Pending Review', tone: 'warning' },
  { value: '7', label: 'Open Roles', tone: 'primary' },
]

export const startups = [
  { id: 'ss-1', name: 'NovaMed', initial: 'N', tone: 'primary', domain: 'HealthTech', stage: 'Early Traction', founder: 'Shantanu G.', team: 4, openRoles: 3, status: 'Active', statusTone: 'success', mentor: 'Mihir Pawar', mobileMeta: 'HealthTech · Seed' },
  { id: 'ss-2', name: 'EduTrack', initial: 'E', tone: 'success', domain: 'EdTech', stage: 'Prototype', founder: 'Arjun M.', team: 3, openRoles: 2, status: 'Active', statusTone: 'success', mentor: 'Mihir Pawar', mobileMeta: 'EdTech · Pre-seed' },
  { id: 'ss-3', name: 'GreenGrid', initial: 'G', tone: 'warning', domain: 'CleanTech', stage: 'Idea', founder: 'Priya S.', team: 2, openRoles: 0, status: 'Pending', statusTone: 'warning', mentor: 'Unassigned', mobileMeta: 'CleanTech' },
  { id: 'ss-4', name: 'FinFlow', initial: 'F', tone: 'warning', domain: 'FinTech', stage: 'Idea', founder: 'Vivaan N.', team: 1, openRoles: 0, status: 'Under Review', statusTone: 'warning', mentor: 'Unassigned', mobileMeta: 'FinTech' },
]

export const reportStats = [
  { value: '7', label: 'Concierge Contacts', caption: '+2 this week', tone: 'primary' },
  { value: '12', label: 'Job Listings Live', caption: '+3 this week', tone: 'success' },
  { value: '3', label: 'Mentorship Sessions', caption: 'Upcoming: 1', tone: 'success' },
  { value: '2', label: 'New Applications', caption: 'Incubation', tone: 'warning' },
]

export const platformEvents = [
  { id: 'pe-1', title: 'Founder access granted — Shantanu Ghuriani (NovaMed)', meta: 'By Mihir Pawar · Today · 9:12 AM', dot: 'success' },
  { id: 'pe-2', title: 'Job listing approved — UI/UX Designer at NovaMed', meta: 'By Mihir Pawar · Yesterday · 3:14 PM', dot: 'success' },
  { id: 'pe-3', title: 'Incubation application submitted — GreenGrid', meta: 'By Priya Shah · Yesterday · 5:30 PM', dot: 'primary' },
  { id: 'pe-4', title: 'Mentorship session requested — Riya Kapoor', meta: 'Faculty mentor needed · Jun 20 · 4:00 PM', dot: 'primary' },
  { id: 'pe-5', title: 'New job listing posted — Marketing Lead at NovaMed', meta: 'Pending approval · Jun 19 · 11:00 AM', dot: 'warning' },
  { id: 'pe-6', title: 'Contact logged — Shantanu G. → Riya Kapoor', meta: 'Brand identity engagement · Jun 18 · 2:15 PM', dot: 'neutral' },
]

export const mobileEvents = [
  { id: 'me-1', title: 'New user: Vivaan Nair', meta: 'Today' },
  { id: 'me-2', title: 'Listing approved: NovaMed', meta: 'Today' },
  { id: 'me-3', title: 'Role update: Riya K.', meta: 'Yesterday' },
  { id: 'me-4', title: 'New startup: FinFlow', meta: 'Jun 24' },
  { id: 'me-5', title: 'Listing rejected: EduTrack', meta: 'Jun 23' },
]

export const reportRange = 'Jun 1 – Jul 1, 2026'

export const READ_ONLY_NOTE =
  'This is a read-only view. To make changes, contact the Backend Manager or Forge Manager.'
