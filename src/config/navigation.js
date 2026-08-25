import { ROLES } from './roles'

/**
 * Every navigation surface for every role, in one place.
 *
 * Reference:
 *   Desktop sidebar   /reference/components/Sidebar/*.png
 *   Desktop navbar    /reference/components/Navbar*.png
 *   Mobile bottom nav /reference/phone components/BottomNav/<Role>/*.png
 *   Mobile more tray  /reference/mast phone ui/<Role>/More Tray.png
 *
 * Sidebars are the full master list per role and are identical on every screen
 * of that role — only the active item changes.
 */

/* -------------------------------------------------------------------------- */
/* Route roots                                                                */
/* -------------------------------------------------------------------------- */

export const ROLE_HOME = {
  [ROLES.STUDENT]: '/student/home',
  [ROLES.FOUNDER]: '/founder/home',
  [ROLES.FORGE_MANAGER]: '/forge/dashboard',
  [ROLES.BACKEND_MANAGER]: '/backend/dashboard',
  [ROLES.SUPER_ADMIN]: '/admin/overview',
}

/* -------------------------------------------------------------------------- */
/* Desktop sidebar                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Each role maps to an ordered list of groups.
 * `divider: true` draws the hairline rule that precedes the final group.
 */
export const SIDEBAR_NAV = {
  [ROLES.STUDENT]: [
    { label: 'Platform', items: [{ label: 'Home', href: '/student/home' }] },
    {
      label: 'Service',
      items: [
        { label: 'Flag My Availability', href: '/student/availability' },
        { label: 'My Skills Profile', href: '/student/skills' },
      ],
    },
    {
      label: 'Projects',
      items: [{ label: 'Browse Projects', href: '/student/projects' }],
    },
    {
      label: 'Work',
      items: [
        { label: 'Browse Jobs', href: '/student/jobs' },
        { label: 'Post a Collab', href: '/student/post-collab' },
        { label: 'My Applications', href: '/student/applications' },
        { label: 'Mentorship', href: '/student/mentorship' },
      ],
    },
    {
      label: 'Incubation',
      items: [{ label: 'Apply for Incubation', href: '/student/incubation' }],
    },
    {
      label: 'Manage',
      divider: true,
      items: [
        { label: 'My Profile', href: '/student/profile' },
        { label: 'Help', href: '/student/help' },
        { label: 'Contact Forge Manager', href: '/student/contact-manager' },
      ],
    },
  ],

  [ROLES.FOUNDER]: [
    {
      label: 'Platform',
      items: [
        { label: 'Home', href: '/founder/home' },
        { label: 'Service', href: '/founder/concierge' },
        { label: 'Search Student Pool', href: '/founder/student-pool' },
        { label: 'My Posted Needs', href: '/founder/posted-needs' },
        { label: 'Contact Log', href: '/founder/contact-log' },
      ],
    },
    {
      label: 'Projects',
      items: [
        { label: 'Projects Under Forge', href: '/founder/projects' },
        { label: 'My Startup Page', href: '/founder/startup' },
        { label: 'Edit Listing', href: '/founder/edit-listing' },
      ],
    },
    {
      label: 'Work',
      items: [
        { label: 'Hiring', href: '/founder/hiring', badge: 4 },
        { label: 'My Listings', href: '/founder/listings' },
        { label: 'Applicants', href: '/founder/applicants' },
        { label: 'Mentorship', href: '/founder/mentorship' },
      ],
    },
    {
      label: 'Incubation',
      items: [
        { label: 'Apply for Incubation', href: '/founder/incubation' },
        { label: 'My Application', href: '/founder/application' },
      ],
    },
    {
      label: 'Manage',
      divider: true,
      items: [
        { label: 'My Profile', href: '/founder/profile' },
        { label: 'Help', href: '/founder/help' },
        { label: 'Contact Forge Manager', href: '/founder/contact-manager' },
      ],
    },
  ],

  [ROLES.FORGE_MANAGER]: [
    {
      label: 'Overview',
      items: [
        { label: 'Dashboard', href: '/forge/dashboard' },
        { label: 'All Students', href: '/forge/students' },
        { label: 'All Founders', href: '/forge/founders' },
      ],
    },
    {
      label: 'Service',
      items: [
        { label: 'Student Pool', href: '/forge/student-pool' },
        { label: 'Contact Log', href: '/forge/contact-log', badge: 3 },
        { label: 'Posted Needs', href: '/forge/posted-needs' },
      ],
    },
    {
      label: 'Projects',
      items: [
        { label: 'All Projects', href: '/forge/projects' },
        { label: 'Featured', href: '/forge/featured' },
      ],
    },
    {
      label: 'Hiring',
      items: [
        { label: 'Approval Queue', href: '/forge/approval-queue', badge: 7 },
        { label: 'All Listings', href: '/forge/listings' },
        { label: 'Contract Log', href: '/forge/contract-log' },
      ],
    },
    {
      label: 'Mentorship',
      items: [
        { label: 'Assign Mentors', href: '/forge/assign-mentors', badge: 2 },
        { label: 'Session Log', href: '/forge/session-log' },
      ],
    },
    {
      label: 'Incubation',
      items: [
        { label: 'Applications', href: '/forge/applications', badge: 5 },
        { label: 'Active Startups', href: '/forge/active-startups' },
      ],
    },
    {
      label: 'Manage',
      divider: true,
      items: [
        { label: 'User Accounts', href: '/forge/user-accounts' },
        { label: 'Role Assignments', href: '/forge/role-assignments' },
        { label: 'Platform Logs', href: '/forge/platform-logs' },
      ],
    },
  ],

  [ROLES.BACKEND_MANAGER]: [
    {
      label: 'Overview',
      items: [
        { label: 'Platform Dashboard', href: '/backend/dashboard' },
        { label: 'All Users', href: '/backend/users' },
        { label: 'Activity Log', href: '/backend/activity-log' },
      ],
    },
    {
      label: 'Access Control',
      items: [
        { label: 'Role Assignments', href: '/backend/role-assignments' },
        { label: 'Grant Founder Access', href: '/backend/grant-access' },
        { label: 'Revoke Access', href: '/backend/revoke-access' },
      ],
    },
    {
      label: 'Content',
      items: [
        { label: 'Job Approval Queue', href: '/backend/job-queue', badge: 7 },
        { label: 'All Listings', href: '/backend/listings' },
        { label: 'Contract Log', href: '/backend/contract-log' },
        { label: 'Contact Log', href: '/backend/contact-log' },
      ],
    },
    {
      label: 'Platform',
      items: [
        { label: 'Platform Settings', href: '/backend/settings' },
        { label: 'Platform Logs', href: '/backend/logs' },
        { label: 'Error Logs', href: '/backend/error-logs' },
      ],
    },
    {
      label: 'My Account',
      divider: true,
      items: [
        { label: 'My Profile', href: '/backend/profile' },
        { label: 'Help', href: '/backend/help' },
      ],
    },
  ],

  [ROLES.SUPER_ADMIN]: [
    {
      label: 'View Only',
      items: [
        { label: 'Platform Overview', href: '/admin/overview' },
        { label: 'All Users', href: '/admin/users' },
        { label: 'All Startups', href: '/admin/startups' },
      ],
    },
    {
      label: 'Activity',
      items: [
        { label: 'Contact Log', href: '/admin/contact-log' },
        { label: 'Job Listings', href: '/admin/job-listings' },
        { label: 'Incubation Status', href: '/admin/incubation-status' },
        { label: 'Contract Log', href: '/admin/contract-log' },
      ],
    },
    {
      label: 'Reports',
      items: [
        { label: 'Platform Summary', href: '/admin/summary' },
        { label: 'Activity Report', href: '/admin/activity-report' },
      ],
    },
    {
      label: 'My Account',
      divider: true,
      items: [{ label: 'My Profile', href: '/admin/profile' }],
    },
  ],
}

/* -------------------------------------------------------------------------- */
/* Desktop navbar                                                             */
/* -------------------------------------------------------------------------- */

/** Students and founders share one link set; the three manager roles add "Manage". */
const BASE_NAVBAR_LINKS = [
  { label: 'Service', key: 'concierge' },
  { label: 'Projects', key: 'projects' },
  { label: 'Mentorship', key: 'mentorship' },
  { label: 'Hiring', key: 'hiring' },
  { label: 'Apply', key: 'apply' },
]

export const NAVBAR_NAV = {
  // `match` lists every route that lights this link up. Taken from the active
  // states drawn across /reference/mast ui/Student/*.png.
  [ROLES.STUDENT]: [
    {
      ...BASE_NAVBAR_LINKS[0],
      href: '/student/availability',
      match: ['/student/availability', '/student/skills'],
    },
    { ...BASE_NAVBAR_LINKS[1], href: '/student/projects' },
    { ...BASE_NAVBAR_LINKS[2], href: '/student/mentorship' },
    {
      ...BASE_NAVBAR_LINKS[3],
      href: '/student/jobs',
      match: ['/student/jobs', '/student/post-collab'],
    },
    {
      ...BASE_NAVBAR_LINKS[4],
      href: '/student/applications',
      match: ['/student/applications', '/student/incubation'],
    },
  ],
  [ROLES.FOUNDER]: [
    {
      ...BASE_NAVBAR_LINKS[0],
      href: '/founder/concierge',
      match: [
        '/founder/concierge',
        '/founder/student-pool',
        '/founder/contact-log',
        '/founder/posted-needs',
      ],
    },
    {
      ...BASE_NAVBAR_LINKS[1],
      href: '/founder/projects',
      match: [
        '/founder/projects',
        '/founder/startup',
        '/founder/edit-listing',
      ],
    },
    { ...BASE_NAVBAR_LINKS[2], href: '/founder/mentorship' },
    {
      ...BASE_NAVBAR_LINKS[3],
      href: '/founder/hiring',
      match: [
        '/founder/hiring',
        '/founder/post-job',
        '/founder/listings',
        '/founder/applicants',
      ],
    },
    {
      ...BASE_NAVBAR_LINKS[4],
      href: '/founder/incubation',
      match: ['/founder/incubation', '/founder/application'],
    },
  ],
  [ROLES.FORGE_MANAGER]: [
    {
      ...BASE_NAVBAR_LINKS[0],
      href: '/forge/student-pool',
      match: ['/forge/student-pool', '/forge/contact-log', '/forge/posted-needs'],
    },
    {
      ...BASE_NAVBAR_LINKS[1],
      href: '/forge/projects',
      match: ['/forge/projects', '/forge/featured', '/forge/active-startups'],
    },
    {
      ...BASE_NAVBAR_LINKS[2],
      href: '/forge/assign-mentors',
      match: ['/forge/assign-mentors', '/forge/session-log'],
    },
    {
      ...BASE_NAVBAR_LINKS[3],
      href: '/forge/approval-queue',
      match: ['/forge/approval-queue', '/forge/listings', '/forge/contract-log'],
    },
    { ...BASE_NAVBAR_LINKS[4], href: '/forge/applications' },
    {
      label: 'Manage',
      key: 'manage',
      href: '/forge/user-accounts',
      match: [
        '/forge/user-accounts',
        '/forge/role-assignments',
        '/forge/platform-logs',
        '/forge/students',
        '/forge/founders',
      ],
    },
  ],
  [ROLES.BACKEND_MANAGER]: [
    { ...BASE_NAVBAR_LINKS[0], href: '/backend/contact-log' },
    { ...BASE_NAVBAR_LINKS[1], href: '/backend/listings' },
    { ...BASE_NAVBAR_LINKS[2], href: '/backend/activity-log' },
    // Hiring covers the job queue; everything administrative sits under Manage —
    // the BM reference frames highlight Manage on Dashboard, All Users,
    // Role Management, Platform Settings and Platform Logs.
    { ...BASE_NAVBAR_LINKS[3], href: '/backend/job-queue' },
    { ...BASE_NAVBAR_LINKS[4], href: '/backend/contract-log' },
    {
      label: 'Manage',
      key: 'manage',
      href: '/backend/settings',
      match: [
        '/backend/settings',
        '/backend/dashboard',
        '/backend/users',
        '/backend/role-assignments',
        '/backend/grant-access',
        '/backend/revoke-access',
        '/backend/logs',
        '/backend/error-logs',
        '/backend/profile',
        '/backend/help',
      ],
    },
  ],
  // Reference active states: Projects on All Startups, Manage on Platform
  // Overview / All Users / Activity Report.
  [ROLES.SUPER_ADMIN]: [
    { ...BASE_NAVBAR_LINKS[0], href: '/admin/contact-log' },
    { ...BASE_NAVBAR_LINKS[1], href: '/admin/startups' },
    { ...BASE_NAVBAR_LINKS[2], href: '/admin/contract-log' },
    { ...BASE_NAVBAR_LINKS[3], href: '/admin/job-listings' },
    { ...BASE_NAVBAR_LINKS[4], href: '/admin/incubation-status' },
    {
      label: 'Manage',
      key: 'manage',
      href: '/admin/overview',
      match: [
        '/admin/overview',
        '/admin/users',
        '/admin/summary',
        '/admin/activity-report',
        '/admin/profile',
      ],
    },
  ],
}

/* -------------------------------------------------------------------------- */
/* Mobile bottom navigation                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Icons are the emoji used in the Figma exports.
 *
 * Note: the Student set below follows the screen mockups
 * (/reference/mast phone ui/Student/*.png), which consistently show
 * "Mentor" as the third item. The lone component export
 * BottomNav/Student/Projects.png disagrees and is treated as the outlier.
 */
export const BOTTOM_NAV = {
  [ROLES.STUDENT]: [
    { label: 'Home', icon: '🏠', href: '/student/home' },
    { label: 'Jobs', icon: '💼', href: '/student/jobs' },
    { label: 'Mentor', icon: '🎓', href: '/student/mentorship' },
    { label: 'Apply', icon: '📝', href: '/student/incubation' },
    { label: 'More', icon: 'more', href: '/student/more' },
  ],
  [ROLES.FOUNDER]: [
    { label: 'Home', icon: '🏠', href: '/founder/home' },
    { label: 'Service', icon: '👥', href: '/founder/concierge' },
    { label: 'Projects', icon: '🚀', href: '/founder/projects' },
    { label: 'Jobs', icon: '💼', href: '/founder/hiring' },
    { label: 'More', icon: 'more', href: '/founder/more' },
  ],
  [ROLES.FORGE_MANAGER]: [
    { label: 'Overview', icon: '📊', href: '/forge/dashboard' },
    { label: 'Students', icon: '👥', href: '/forge/students' },
    { label: 'Projects', icon: '🚀', href: '/forge/projects' },
    { label: 'Hiring', icon: '💼', href: '/forge/approval-queue' },
    { label: 'More', icon: 'more', href: '/forge/more' },
  ],
  [ROLES.BACKEND_MANAGER]: [
    { label: 'Dashboard', icon: '📊', href: '/backend/dashboard' },
    { label: 'Users', icon: '👥', href: '/backend/users' },
    { label: 'Queue', icon: '⚡', href: '/backend/job-queue' },
    { label: 'Logs', icon: '📋', href: '/backend/logs' },
    { label: 'Settings', icon: '⚙️', href: '/backend/settings' },
  ],
  [ROLES.SUPER_ADMIN]: [
    { label: 'Overview', icon: '📊', href: '/admin/overview' },
    { label: 'Users', icon: '👥', href: '/admin/users' },
    { label: 'Startups', icon: '🚀', href: '/admin/startups' },
    { label: 'Activity', icon: '📋', href: '/admin/activity-report' },
    { label: 'More', icon: 'more', href: '/admin/more' },
  ],
}

/* -------------------------------------------------------------------------- */
/* Mobile "More" tray                                                         */
/* -------------------------------------------------------------------------- */

/** Backend Manager has no tray — its fifth bottom-nav slot is Settings. */
export const MORE_TRAY = {
  [ROLES.STUDENT]: [
    {
      label: 'Browse Projects',
      description: 'Explore startups and collab opportunities',
      icon: '🚀',
      href: '/student/projects',
    },
    {
      label: 'Mentorship',
      description: 'View your assigned mentor',
      icon: '🎓',
      href: '/student/mentorship',
    },
    {
      label: 'Post a Collab',
      description: 'Looking for a collaborator?',
      icon: '🤝',
      href: '/student/post-collab',
    },
    {
      label: 'Flag Availability',
      description: "Let founders know you're free to work",
      icon: '📖',
      href: '/student/availability',
    },
    {
      label: 'My Profile',
      description: 'Edit your skills and details',
      icon: '👤',
      href: '/student/profile',
    },
  ],
  [ROLES.FOUNDER]: [
    {
      label: 'Mentorship',
      description: 'View your mentor and request sessions',
      icon: '🎓',
      href: '/founder/mentorship',
    },
    {
      label: 'Apply for Incubation',
      description: 'Submit your startup application',
      icon: '📋',
      href: '/founder/incubation',
    },
    {
      label: 'My Profile',
      description: 'Edit your account and startup details',
      icon: '👤',
      href: '/founder/profile',
    },
  ],
  [ROLES.FORGE_MANAGER]: [
    {
      label: 'Incubation Applications',
      description: 'Review startup applications',
      icon: '📚',
      href: '/forge/applications',
    },
    {
      label: 'User Accounts',
      description: 'View all platform users',
      icon: '🗂️',
      href: '/forge/user-accounts',
    },
    {
      label: 'Contact Log',
      description: 'All founder–student contact history',
      icon: '📒',
      href: '/forge/contact-log',
    },
  ],
  [ROLES.SUPER_ADMIN]: [
    {
      label: 'Read-only access',
      description: 'You have view-only permissions',
      icon: '👁️',
      href: '/admin/overview',
    },
    {
      label: 'Platform Overview',
      description: 'Go to the main overview',
      icon: '📊',
      href: '/admin/overview',
    },
    {
      label: 'Activity Report',
      description: 'Last 30 days of platform activity',
      icon: '📋',
      href: '/admin/activity-report',
    },
  ],
}
