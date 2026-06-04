/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Cache navigations client-side so switching tabs is instant, instead of
    // refetching from the server every time. Freshness after a change is still
    // guaranteed because every mutation calls router.refresh(), which clears the
    // whole Router Cache — so completing a habit on one page still shows up on
    // the others immediately.
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
