import { siteConfig } from '@/config/site'

/**
 * Compose page-level Next.js metadata from a small, page-specific payload.
 * Keeps title/description/OG/Twitter/canonical consistent across every route.
 *
 * @param {object}  options
 * @param {string}  options.title        Page title (template-wrapped by the root layout).
 * @param {string}  options.description  Meta description.
 * @param {string}  options.path         Route path used for the canonical URL, e.g. '/login'.
 * @param {string}  [options.image]      Overrides the shared card. Omit to inherit
 *   `src/app/opengraph-image.png` via Next's file convention.
 * @param {string[]}[options.keywords]   Additional keywords merged with the site defaults.
 * @param {boolean} [options.noIndex]    Exclude the page from search engines (authenticated areas).
 */
export function buildMetadata({
  title,
  description = siteConfig.description,
  path = '/',
  image,
  keywords = [],
  noIndex = false,
}) {
  const url = new URL(path, siteConfig.url).toString()
  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name

  return {
    title,
    description,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: { canonical: url },
    robots: noIndex
      ? { index: false, follow: false, nocache: true }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      siteName: siteConfig.name,
      title: fullTitle,
      description,
      url,
      locale: siteConfig.locale,
      // Only set when overridden — otherwise the opengraph-image.png file
      // convention supplies the card with a correct absolute URL.
      ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: fullTitle }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      site: siteConfig.twitter,
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

/** JSON-LD organisation graph rendered once in the root layout. */
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: siteConfig.name,
    alternateName: siteConfig.university,
    description: siteConfig.description,
    url: siteConfig.url,
    logo: new URL(siteConfig.ogImage, siteConfig.url).toString(),
  }
}
