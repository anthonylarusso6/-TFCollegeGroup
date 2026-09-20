/** @type {import('next').NextConfig} */

// Athlete and team photos are served from Supabase Storage, so that host has to
// be in the image allowlist. Derived from the Supabase URL by default so there's
// one place to change when the project moves; NEXT_PUBLIC_SUPABASE_HOSTNAME can
// override it if the two ever need to differ.
const supabaseHostname =
  process.env.NEXT_PUBLIC_SUPABASE_HOSTNAME ||
  (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '')

if (!supabaseHostname) {
  throw new Error(
    'Cannot determine the Supabase image host. Set NEXT_PUBLIC_SUPABASE_URL ' +
    '(or NEXT_PUBLIC_SUPABASE_HOSTNAME) before building. See .env.example.'
  )
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
      },
    ],
  },
}

module.exports = nextConfig
