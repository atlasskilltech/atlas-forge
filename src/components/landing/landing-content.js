/**
 * Copy and figures for the landing page, transcribed from
 * /reference/landing-page/Forge Landing - 5.png.
 *
 * Kept out of the page component so the markup stays readable, and so a
 * wording change is an edit to a string rather than to a layout.
 *
 * The Infrastructure block has its own file (`infrastructure-data.js`) because
 * it also drives the four expanded panels.
 */

/** "A University-Led Incubation Model." — the About band. */
export const ABOUT_STATS = [
  { value: '10,000', label: 'Sq Ft\nFacility' },
  { value: '4000+', label: 'Campus\nTalent' },
  { value: '300+', label: 'Faculty\nNetwork' },
  { value: 'All In\nOne', label: 'Faculty\nNetwork' },
]

/** The violet "An Exclusive Access Incubation lab" band. */
export const EXCLUSIVE_STATS = [
  { value: '50', label: 'Startups\nincubated' },
  { value: '80%', label: 'Incubated startups\nthat are women-led' },
  { value: '21', label: 'Average founder\nage (years)' },
]

/** "Why should you join Forge?" */
export const WHY_JOIN = [
  {
    title: 'Build with the right support',
    body: 'Get access to mentors, resources, and a community that helps you turn your idea into a real product.',
  },
  {
    title: 'Grow with the right network',
    body: 'Connect with founders, investors, industry experts, and opportunities that can help take your venture forward.\nWork through real challenges, test your assumptions, and gain practical experience along the way.',
  },
]

/** The violet statistics strip in the ATLAS BRIDGE collage. */
export const BRIDGE_STATS = [
  { value: '30', label: '3D printers across\nmultiple materials' },
  { value: '60+', label: 'Fashion lab\nmachines' },
  { value: '4,000', label: 'Students across\n04 schools.' },
  { value: '10K', label: 'Sq ft, 2 floors -\nalready running' },
]

/** "Multidisciplinary Support." — the four schools of the university. */
export const SCHOOLS = [
  {
    name: 'Design',
    body: 'Make it useful and desirable.',
    logo: '/assets/landing-page/images/school-isdi.png',
    alt: 'ISDI',
    /* The tinted card and the solid logo plate, sampled from the reference. */
    card: '#fbe4ee',
    plate: '#ec2a7e',
    width: 147,
    height: 59,
  },
  {
    name: 'Business',
    body: 'Make the model viable.',
    logo: '/assets/landing-page/images/school-isme.png',
    alt: 'ISME',
    card: '#dcedf7',
    plate: '#1ca0dc',
    width: 178,
    height: 59,
  },
  {
    name: 'Engineering',
    body: 'Make it work reliably.',
    logo: '/assets/landing-page/images/school-ugdx.png',
    alt: 'uGDX',
    card: '#fbe0e2',
    plate: '#ec2b30',
    width: 218,
    height: 55,
  },
  {
    name: 'Law',
    body: 'Make it legally ready.',
    logo: '/assets/landing-page/images/school-law.png',
    alt: 'LAW',
    card: '#f7e3d6',
    plate: '#d96c19',
    width: 187,
    height: 57,
  },
]

/** "One Journey. One Clear Path." */
export const JOURNEY = [
  { title: 'Define', body: 'Start with the problem, the user and one clear reason to build.' },
  { title: 'Prototype', body: 'Turn the idea into a working model you can see, hold and improve.' },
  { title: 'Produce', body: 'Make the product reliable, repeatable and ready for production.' },
  { title: 'Validate', body: 'Set up the company, validate the idea and meet legal requirements.' },
  {
    title: 'Launch',
    body: 'Build the brand, packaging and market plan customers can understand.',
  },
  { title: 'Grow', body: 'Use proof, partners and funding to take the product to market.' },
]

/** "Manufacturing Made Simpler" — the numbered indigo card. */
export const MANUFACTURING = [
  {
    number: '01',
    title: 'Design for production',
    body: 'Make every part practical, reliable and ready to produce.',
  },
  {
    number: '02',
    title: 'Procurement Partners',
    body: 'Find the right materials, components and suppliers.',
  },
  {
    number: '03',
    title: 'Testing + Certification',
    body: 'Work with Maharashtra agencies to test, validate and certify the product.',
  },
  {
    number: '04',
    title: 'Specialist Advisers',
    body: 'Get focused help with materials, processes and industry needs.',
  },
]

/**
 * "Products In Development." — the incubated startups, in the reference's own
 * three groups. `logo` is null where the reference shows the "Stealth Mode"
 * wordmark instead of a brand.
 */
export const STARTUP_GROUPS = [
  {
    number: '01',
    category: 'Technology + Mobility',
    items: [
      {
        logo: '/assets/landing-page/images/startup-stealth-mode.png',
        alt: 'Stealth Mode',
        width: 1000,
        height: 218,
        logoHeight: 'h-[26px]',
        title: 'Retail intelligence for India’s informal retail economy.',
        body: 'Building a clearer operating layer for neighbourhood retailers—turning everyday trade into decisions owners can act on.',
      },
      {
        logo: '/assets/landing-page/images/startup-stealth-mode.png',
        alt: 'Stealth Mode',
        width: 1000,
        height: 218,
        logoHeight: 'h-[26px]',
        title: 'A compact underwater rover for shallow-water aquaculture.',
        body: 'Extending a farmer’s view below the waterline, making routine crop and water monitoring more accessible from the surface.',
      },
      {
        logo: '/assets/landing-page/images/startup-stealth-mode.png',
        alt: 'Stealth Mode',
        width: 1000,
        height: 218,
        logoHeight: 'h-[26px]',
        title: 'A tactical unmanned ground vehicle platform in development.',
        body: 'Dhanay Padmashali and Krishna Mistry are developing a configurable rover for logistics, surveillance and reconnaissance at the edge.',
      },
      {
        logo: '/assets/landing-page/images/startup-medtrav.png',
        alt: 'MedTrav',
        width: 190,
        height: 45,
        logoHeight: 'h-[32px]',
        title: 'Portable biomedical-waste containment for care beyond hospitals.',
        body: 'The founder is making safer disposal practical for travellers, caregivers and communities wherever treatment happens outside a clinical setting.',
      },
    ],
  },
  {
    number: '02',
    category: 'Consumer + Lifestyle',
    items: [
      {
        logo: '/assets/landing-page/images/startup-neeshika.png',
        alt: 'neeshika',
        width: 206,
        height: 45,
        logoHeight: 'h-[30px]',
        title: 'Diamonds beyond jewellery—out of the locker and into everyday life.',
        body: 'The team is reimagining lab-grown diamonds as expressive, wearable objects designed for modern, everyday use.',
      },
      {
        logo: '/assets/landing-page/images/startup-arimau.png',
        alt: 'ARIMAU',
        width: 1000,
        height: 321,
        logoHeight: 'h-[28px]',
        title: 'A brand built for pets, the planet and their people.',
        body: 'The team is shaping a thoughtful pet-care brand around the everyday bond between animals, people and a healthier planet.',
      },
      {
        logo: '/assets/landing-page/images/startup-tago.png',
        alt: 'TAGO Studio',
        width: 1000,
        height: 309,
        logoHeight: 'h-[36px]',
        title: 'Substance over status.',
        body: 'The founder is building a fashion studio where considered design, material character and lasting value matter more than labels.',
      },
    ],
  },
  {
    number: '03',
    category: 'Play + Creative',
    items: [
      {
        logo: '/assets/landing-page/images/startup-bloc.png',
        alt: 'bloc',
        width: 1000,
        height: 666,
        logoHeight: 'h-[44px]',
        title: 'Intelligent toys designed for play-based learning.',
        body: 'Translating familiar forms, stories and activities into a playful system that helps children learn by doing.',
      },
      {
        logo: '/assets/landing-page/images/startup-creative-circuit.png',
        alt: 'The Creative Circuit (CC)',
        width: 1000,
        height: 247,
        logoHeight: 'h-[44px]',
        title: 'A multi-city incubator for collaborative arts.',
        body: 'The team is connecting creative communities across Kolkata and Mumbai to turn cross-disciplinary collaboration into new productions.',
      },
    ],
  },
]

/**
 * "Atlas Concierge" — the service cards.
 *
 * Images and labels come from the supplied Atlas Concierge reference set; each
 * label is the image's own file name.
 */
export const CONCIERGE = [
  {
    image: '/assets/landing-page/images/concierge-3d-rendering-animation.png',
    alt: '3D Rendering & Animation',
    label: '3D Rendering & Animation',
  },
  {
    image: '/assets/landing-page/images/concierge-branding-packaging.png',
    alt: 'Branding & Packaging',
    label: 'Branding & Packaging',
  },
  {
    image: '/assets/landing-page/images/concierge-fashion-design.png',
    alt: 'Fashion Design',
    label: 'Fashion Design',
  },
  {
    image: '/assets/landing-page/images/concierge-interior-design.png',
    alt: 'Interior Design',
    label: 'Interior Design',
  },
  {
    image: '/assets/landing-page/images/concierge-legal-advisory.png',
    alt: 'Legal Advisory',
    label: 'Legal Advisory',
  },
]

/** "Built by founders. For founders." */
export const TEAM = [
  {
    name: 'Mihir Pawar',
    role: 'Head of Incubation',
    photo: '/assets/landing-page/images/team-mihir-pawar.png',
    body: 'A founder-turned-incubation leader, Mihir built a hardware startup from zero to funding with support from the Startup India Seed Fund and NIDHI-PRAYAS. He now helps founders turn early innovation into fundable, market-ready ventures.',
  },
  {
    name: 'Abhrojit Boral',
    role: 'Chief Innovation Officer',
    photo: '/assets/landing-page/images/team-abhrojit-boral.png',
    body: 'Abhrojit brings more than 10 years of experience in human-centred design and venture growth. An NIFT Gold Medallist, UK postgraduate and PhD scholar, he helps founders validate markets, build products people value and scale with clarity.',
  },
]
