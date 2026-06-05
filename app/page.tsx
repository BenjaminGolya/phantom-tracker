import { LandingPage } from "@/components/landing/landing-page";

// Public landing page — shown to everyone (logged in or out). When signed in,
// its CTAs switch to "Open app". The installed PWA opens straight at /dashboard
// (see manifest start_url), so daily use isn't slowed down by this page.
export default function HomePage() {
  return <LandingPage />;
}
