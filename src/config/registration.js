/**
 * Shared constants for the public "Join the ATLAS Forge Network" registration.
 *
 * Reference: /reference/form/ (the Start frame, the four role frames and the
 * Dev Notes). Like `@/config/landing`, this module is deliberately free of
 * `server-only` and of any database import: the form component in the browser
 * and the validator on the server both read these option lists, so the two can
 * never drift into a state where the page offers a value the API rejects.
 *
 * Every option is stored as its `value` (a stable slug), never its label, so
 * reworded copy never invalidates a row already in `registration_requests`.
 */

/* -------------------------------------------------------------------------- */
/* Who are you? — the role selector                                           */
/* -------------------------------------------------------------------------- */

export const REGISTRATION_ROLES = Object.freeze([
  { value: 'atlas_student', label: 'Atlas Student' },
  { value: 'atlas_alumni', label: 'Atlas Alumni' },
  { value: 'atlas_faculty', label: 'Atlas Faculty' },
  { value: 'others', label: 'Others' },
])
export const REGISTRATION_ROLE_VALUES = REGISTRATION_ROLES.map((role) => role.value)
export const REGISTRATION_ROLE_LABEL = Object.fromEntries(
  REGISTRATION_ROLES.map((role) => [role.value, role.label])
)

/* -------------------------------------------------------------------------- */
/* Student — School picker (single-select, brand-coloured in the reference)   */
/* -------------------------------------------------------------------------- */

export const SCHOOLS = Object.freeze([
  { value: 'isdi', label: 'ISDI', color: '#e6177e' },
  { value: 'isme', label: 'ISME', color: '#28a3dd' },
  { value: 'ugdx', label: 'uGDX', color: '#e8252a' },
  { value: 'law', label: 'LAW', color: '#c0622a' },
])
export const SCHOOL_VALUES = SCHOOLS.map((school) => school.value)

/* -------------------------------------------------------------------------- */
/* Shared option lists                                                        */
/* -------------------------------------------------------------------------- */

/** Student / Others — "Type of support" (multi-select). */
export const TYPE_OF_SUPPORT = Object.freeze([
  { value: 'internship', label: 'Internship' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'offering-services', label: 'Offering Services' },
  { value: 'incubation-support', label: 'Incubation Support' },
  { value: 'other', label: 'Other' },
])
export const TYPE_OF_SUPPORT_VALUES = TYPE_OF_SUPPORT.map((option) => option.value)

/** Alumni / Faculty — "Are you willing to mentor?" (single-select). */
export const WILLING_TO_MENTOR = Object.freeze([
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
])
export const WILLING_TO_MENTOR_VALUES = WILLING_TO_MENTOR.map((option) => option.value)

/** Alumni — "Are you seeking mentorship?" (single-select). */
export const SEEKING_MENTORSHIP = Object.freeze([
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
])
export const SEEKING_MENTORSHIP_VALUES = SEEKING_MENTORSHIP.map((option) => option.value)

/** Alumni / Faculty — "Areas of mentorship interest" (multi-select). */
export const MENTORSHIP_AREAS = Object.freeze([
  { value: 'business-strategy', label: 'Business & Strategy' },
  { value: 'product-technology', label: 'Product & Technology' },
  { value: 'design-creative', label: 'Design & Creative' },
  { value: 'marketing-growth', label: 'Marketing & Growth' },
  { value: 'finance-fundraising', label: 'Finance & Fundraising' },
  { value: 'sales-business-development', label: 'Sales & Business Development' },
  { value: 'operations-supply-chain', label: 'Operations & Supply Chain' },
  { value: 'legal-compliance', label: 'Legal & Compliance' },
  { value: 'hr-culture', label: 'HR & Culture' },
  { value: 'government-grants-policy', label: 'Government Grants & Policy' },
  {
    value: 'sector-specific',
    label: 'Sector-specific (Fintech, Edtech, Healthtech, Agritech, D2C/Private Label, CleanTech, SaaS, Deep Tech)',
  },
  { value: 'career-personal-development', label: 'Career & Personal Development' },
])
export const MENTORSHIP_AREAS_VALUES = MENTORSHIP_AREAS.map((option) => option.value)

/** Alumni / Faculty — "Would you like to conduct a session or event?" (single). */
export const CONDUCT_SESSION = Object.freeze([
  { value: 'conduct', label: 'Yes- I want to conduct' },
  { value: 'attend', label: 'Yes- I want to attend' },
  { value: 'both', label: 'Both' },
  { value: 'no', label: 'No' },
])
export const CONDUCT_SESSION_VALUES = CONDUCT_SESSION.map((option) => option.value)

/** Alumni / Faculty — "What type of session?" (multi-select). */
export const SESSION_TYPES = Object.freeze([
  { value: 'guest-lecture', label: 'Guest lecture' },
  { value: 'masterclass', label: 'Masterclass' },
  { value: 'panel-discussion', label: 'Panel discussion' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'pitch-competition-judge', label: 'Pitch competition judge' },
  { value: 'networking-event', label: 'Networking event' },
  { value: 'webinar-ama', label: 'Webinar / AMA' },
  { value: 'not-applicable', label: 'Not applicable' },
])
export const SESSION_TYPES_VALUES = SESSION_TYPES.map((option) => option.value)

/** Alumni / Faculty — "Preferred audience" (multi-select). */
export const PREFERRED_AUDIENCE = Object.freeze([
  { value: 'students', label: 'Students' },
  { value: 'startup-founders', label: 'Startup founders' },
  { value: 'alumni', label: 'Alumni' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'open-to-all', label: 'Open to all' },
])
export const PREFERRED_AUDIENCE_VALUES = PREFERRED_AUDIENCE.map((option) => option.value)

/** Alumni — "Are you open to investing in startups?" (single-select). */
export const OPEN_TO_INVESTING = Object.freeze([
  { value: 'actively-investing', label: 'Yes – actively investing' },
  { value: 'small-cheques', label: 'Yes – open to starting with small cheques (₹5L+)' },
  { value: 'want-to-learn', label: 'Maybe – want to learn more' },
  { value: 'no', label: 'No' },
])
export const OPEN_TO_INVESTING_VALUES = OPEN_TO_INVESTING.map((option) => option.value)

/** Alumni — "Are you looking for incubation support?" (single-select). */
export const LOOKING_FOR_INCUBATION = Object.freeze([
  { value: 'have-idea', label: 'Yes – I have a startup idea' },
  { value: 'have-running', label: 'Yes – I have a running startup' },
  { value: 'no', label: 'No' },
  { value: 'maybe', label: 'Maybe' },
])
export const LOOKING_FOR_INCUBATION_VALUES = LOOKING_FOR_INCUBATION.map((option) => option.value)

/** Alumni — "What support do you need?" (multi-select). */
export const INCUBATION_SUPPORT_NEEDS = Object.freeze([
  { value: 'mentorship', label: 'Mentorship' },
  { value: 'funding-investor-connect', label: 'Funding & investor connect' },
  { value: 'co-working-space', label: 'Co-working space' },
  { value: 'legal-compliance', label: 'Legal & compliance' },
  { value: 'government-grants', label: 'Government grants' },
  { value: 'market-access', label: 'Market access' },
  { value: 'pitch-prep', label: 'Pitch prep' },
  { value: 'not-applicable', label: 'Not applicable' },
])
export const INCUBATION_SUPPORT_NEEDS_VALUES = INCUBATION_SUPPORT_NEEDS.map((o) => o.value)

/** Alumni — "Preferred sectors to invest in" (multi-select). */
export const INVEST_SECTORS = Object.freeze([
  { value: 'technology', label: 'Technology' },
  { value: 'design-creative', label: 'Design & Creative' },
  { value: 'healthcare-medtech', label: 'Healthcare & MedTech' },
  { value: 'fintech', label: 'Fintech' },
  { value: 'edtech', label: 'Edtech' },
  { value: 'agritech-foodtech', label: 'Agritech & FoodTech' },
  { value: 'd2c-private-label', label: 'D2C & Private Label Brands' },
  { value: 'cleantech', label: 'CleanTech' },
  { value: 'e-commerce', label: 'E-Commerce' },
  { value: 'saas-b2b', label: 'SaaS & B2B' },
  { value: 'deep-tech', label: 'Deep Tech' },
  { value: 'open-to-all-sectors', label: 'Open to all sectors' },
])
export const INVEST_SECTORS_VALUES = INVEST_SECTORS.map((option) => option.value)

/** Alumni — "Are you part of any angel network?" (single-select). */
export const ANGEL_NETWORKS = Object.freeze([
  { value: 'mumbai-angels', label: 'Mumbai Angels' },
  { value: 'indian-angel-network', label: 'Indian Angel Network' },
  { value: 'letsventure', label: 'LetsVenture' },
  { value: 'not-yet', label: 'No – not yet' },
  { value: 'other', label: 'Other' },
])
export const ANGEL_NETWORKS_VALUES = ANGEL_NETWORKS.map((option) => option.value)

/** Alumni — "Batch / Graduation year" (2015–2026, newest first). */
export const GRADUATION_YEARS = Object.freeze(
  Array.from({ length: 2026 - 2015 + 1 }, (_, index) => 2026 - index)
)
export const GRADUATION_YEAR_VALUES = GRADUATION_YEARS.map((year) => String(year))

/* -------------------------------------------------------------------------- */
/* Field length limits (enforced in the service; mirrored by the inputs)      */
/* -------------------------------------------------------------------------- */

export const REGISTRATION_LIMITS = Object.freeze({
  fullName: 160,
  email: 190,
  phone: 32,
  department: 160,
  course: 160,
  currentCity: 120,
  currentRoleCompany: 200,
  organisation: 160,
  designation: 160,
  industrySector: 160,
  yearsExperience: 60,
  url: 255,
  shortText: 500,
  message: 2000,
  topics: 2000,
  comments: 2000,
})
