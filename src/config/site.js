/**
 * Single source of truth for global site identity.
 * Consumed by SEO metadata, structured data and layout chrome.
 */
export const siteConfig = {
  name: 'ATLAS Forge',
  shortName: 'Forge',
  tagline: 'Product Development Centre',
  university: 'ATLAS SkillTech University',
  description:
    'The Product Development Centre for ATLAS SkillTech University — connecting students, founders, and mentors.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://forge.atlasuniversity.edu.in',
  locale: 'en_IN',
  twitter: '@atlasuniversity',
  ogImage: '/brand/atlas-forge-logo.png',
  keywords: [
    'ATLAS Forge',
    'ATLAS SkillTech University',
    'student incubation',
    'startup jobs',
    'campus hiring',
    'mentorship',
    'product development centre',
  ],
}

export const brand = {
  forgeLogo: '/brand/atlas-forge-logo.png',
  universityLogo: '/brand/atlas-skilltech-university.png',
  universityLogoWhite: '/brand/atlas-skilltech-university-white.png',
}
