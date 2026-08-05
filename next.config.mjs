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
