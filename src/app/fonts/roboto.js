import localFont from 'next/font/local'

// Roboto for the public landing and registration pages, self-hosted (latin
// subset, variable 400–700) rather than loaded via next/font/google, whose
// build-time fetch fails on the production server. See src/app/layout.js.
export const roboto = localFont({
  src: './roboto-latin-var.woff2',
  weight: '400 700',
  style: 'normal',
  display: 'swap',
  variable: '--font-roboto',
})
