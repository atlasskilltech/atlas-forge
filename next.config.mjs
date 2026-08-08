const isProduction = process.env.NODE_ENV === 'production'

/**
 * Content Security Policy.
 *
 * `script-src` keeps `'unsafe-inline'` because Next inlines the bootstrap and
 * RSC-payload scripts on every page. The strict alternative is a per-request
 * nonce, which Next can only apply while server-rendering — it would force
 * every page, including the statically prerendered login, select-role and
 * styleguide screens, to render on each request. That is a deliberate open
 * question rather than an oversight; everything else here is strict, and
 * `object-src 'none'`, `base-uri 'self'` and `frame-ancestors 'none'` still
 * remove the three cheapest ways to turn an injection into a page takeover.
 *
 * `style-src` allows inline styles because a handful of components size
 * themselves with a `style` attribute (ProgressRing, the global error screen),
 * and CSP treats a style attribute as an inline style.
 *
 * `'unsafe-eval'` is development only — React uses `eval` there to rebuild
 * server stack traces in the browser, and neither React nor Next needs it in a
 * production build.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProduction ? '' : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self' data:",
  // The app talks only to its own Route Handlers.
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  // `upgrade-insecure-requests` is deliberately NOT set. A production build is
  // routinely served over plain HTTP here — `next start` behind XAMPP, and any
  // deployment that terminates TLS at a reverse proxy — and the directive
  // rewrites every subresource to https://, which fails with
  // ERR_SSL_PROTOCOL_ERROR when nothing is listening on 443. HSTS below is the
  // right tool for forcing HTTPS, and it only applies where TLS actually
  // exists.
].join('; ')

/**
 * Applied to every response. `X-Frame-Options` duplicates the CSP
 * `frame-ancestors` directive on purpose — older browsers honour only the
 * former, newer ones prefer the latter.
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    // The platform asks for none of these; denying them means an injected
    // script cannot ask on its behalf either.
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
  // HSTS is production-only: sending it from a plain-HTTP development server
  // would pin localhost to HTTPS in the developer's browser.
  ...(isProduction
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 220, 256],
  },
  experimental: {
    optimizePackageImports: ['clsx', 'tailwind-merge'],
  },
  /**
   * Handled at the routing layer rather than by a page calling `redirect()`:
   * no component renders, no RSC round trip, and it avoids React's
   * performance.measure error when a component throws the redirect signal
   * inside a Suspense boundary.
   */
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      {
        // Every API response is personal to the caller's session. Without this
        // a shared cache — or the browser's own back/forward cache — could
        // hand one signed-in user's data to the next one on the machine.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          // JSON needs no scripts, styles, frames or anything else.
          { key: 'Content-Security-Policy', value: "default-src 'none'; frame-ancestors 'none'" },
        ],
      },
    ]
  },

  async redirects() {
    return [
      // The platform has no public marketing page — the root is sign-in.
      { source: '/', destination: '/login', permanent: false },
      // Backend Manager's bottom nav has no "More" slot; its fifth item is Settings.
      { source: '/backend/more', destination: '/backend/dashboard', permanent: false },
    ]
  },
}

export default nextConfig
