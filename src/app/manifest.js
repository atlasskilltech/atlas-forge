import { siteConfig } from '@/config/site'

export default function manifest() {
  return {
    name: `${siteConfig.name} — ${siteConfig.tagline}`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: '/login',
    display: 'standalone',
    background_color: '#f7f8fc',
    theme_color: '#1e2235',
    lang: 'en-IN',
    icons: [
      { src: '/icon.png', sizes: '180x180', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
