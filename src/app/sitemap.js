import { siteConfig } from '@/config/site'

/**
 * Only publicly indexable routes belong here. Role dashboards are behind
 * authentication and are excluded in robots.js.
 */
const PUBLIC_ROUTES = [
  { path: '/login', priority: 1, changeFrequency: 'monthly' },
]

export default function sitemap() {
  const lastModified = new Date()

  return PUBLIC_ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: new URL(path, siteConfig.url).toString(),
    lastModified,
    changeFrequency,
    priority,
  }))
}
