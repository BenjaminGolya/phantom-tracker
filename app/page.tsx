import { LandingPage } from "@/components/landing/landing-page";

const SITE_URL = "https://phantomtracker.io";

// Structured data so Google can show a rich result for the app.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Phantom Tracker",
      description: "A free, dark, minimalist habit tracker with streaks, levels and a living world.",
    },
    {
      "@type": "SoftwareApplication",
      name: "Phantom Tracker",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web, iOS, Android",
      url: SITE_URL,
      description:
        "Build daily streaks, earn XP and levels, and grow a living world that reflects your consistency. Free, on every device.",
      offers: [
        { "@type": "Offer", price: "0", priceCurrency: "EUR", name: "Free" },
        { "@type": "Offer", price: "2", priceCurrency: "EUR", name: "Pro (monthly)" },
      ],
    },
  ],
};

// Public landing page - shown to everyone (logged in or out). When signed in,
// its CTAs switch to "Open app". The installed PWA opens straight at /dashboard
// (see manifest start_url), so daily use isn't slowed down by this page.
export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingPage />
    </>
  );
}
