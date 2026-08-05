import { siteConfig } from '@/config/site'

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Authenticated role areas carry no public SEO value.
        disallow: [
          '/api/',
          '/student/',
          '/founder/',
          '/forge/',
          '/backend/',
          '/admin/',
          '/select-role',
          '/styleguide',
        ],
      },
    ],
    sitemap: new URL('/sitemap.xml', siteConfig.url).toString(),
    host: siteConfig.url,
  }
}
