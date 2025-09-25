/** @type {import('next').NextConfig} */
const nextConfig = {
  // Pages Router only (no App Router)
  experimental: {
    // Remove appDir - it's not needed in v15 for Pages Router
    // Other experimental flags if needed, but keep minimal
  },
  // swcMinify is default in v15 - don't set it
  reactStrictMode: true,
  // Turbopack root fix: Explicitly set to current dir to silence warning
  turbopack: {
    root: __dirname,
  },
  // Ensure no output conflicts
  output: 'standalone', // Optional: Better for deployment, but safe for dev
};

module.exports = nextConfig;