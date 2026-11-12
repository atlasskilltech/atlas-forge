import localFont from 'next/font/local'
import { siteConfig } from '@/config/site'
import { organizationJsonLd } from '@/lib/seo'
import './globals.css'

// Inter is self-hosted (latin subset, variable 400–700) instead of loaded via
// next/font/google: on the production server Google Fonts returns
// fonts.gstatic.com/l/font?kit=…&… URLs that Turbopack's font loader cannot
// resolve, which failed `next build`. Self-hosting also removes the build's
// network dependency on Google Fonts.
const inter = localFont({
  src: './fonts/inter-latin-var.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-inter',
})

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.university, url: siteConfig.url }],
  creator: siteConfig.university,
  publisher: siteConfig.university,
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: siteConfig.name,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    locale: siteConfig.locale,
    // Card image comes from src/app/opengraph-image.png (file convention).
  },
  twitter: {
    card: 'summary_large_image',
    site: siteConfig.twitter,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f8fc' },
    { media: '(prefers-color-scheme: dark)', color: '#1e2235' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-dvh bg-canvas font-sans text-ink antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-control focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        {children}
        <script
          type="application/ld+json"
          // Static, developer-authored JSON-LD — no user input reaches this string.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
      </body>
    </html>
  )
}
