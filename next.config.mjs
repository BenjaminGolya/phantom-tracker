/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Don't reuse a stale client-side Router Cache entry for dynamic pages.
    // Ensures navigating between /habits and /dashboard always refetches fresh
    // server data, so a completion on one page shows up immediately on the other.
    staleTimes: {
      dynamic: 0,
      static: 180,
    },
  },
};

export default nextConfig;
