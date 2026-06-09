import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal/legal-page";

const CONTACT = "support@phantomtracker.io";
const UPDATED = "June 10, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Phantom Tracker collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy explains what data Phantom Tracker (&ldquo;we&rdquo;, &ldquo;us&rdquo;) collects,
        why, and your rights over it. We only collect what we need to run your account, and we
        <strong> never sell your data</strong>.
      </p>

      <Section title="1. Data we collect">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Account:</strong> your email address, an optional display name, and — if you sign in with Google — your Google profile picture.</li>
          <li><strong>Authentication:</strong> a securely hashed password (for email sign-up), and short-lived email codes if you enable two-factor authentication.</li>
          <li><strong>Your content:</strong> the habits, goals, categories, check-ins, streaks and notes you create.</li>
          <li><strong>Preferences:</strong> your language and plan/subscription status.</li>
          <li><strong>Notifications:</strong> if you enable reminders, a push subscription token for your device/browser so we can deliver them.</li>
          <li><strong>Billing:</strong> if you upgrade to Pro, a Stripe customer/subscription identifier. We never see or store your full card number.</li>
        </ul>
      </Section>

      <Section title="2. How we use your data">
        <ul className="list-disc pl-5 space-y-1">
          <li>To provide the core service: storing and showing your habits, streaks, levels and stats.</li>
          <li>To send essential account email (verification, password reset, sign-in codes, billing and account notices).</li>
          <li>To send optional product updates — only if you explicitly opt in. You can unsubscribe at any time.</li>
          <li>To deliver reminder push notifications you&apos;ve set up.</li>
          <li>To keep the service secure and prevent abuse.</li>
        </ul>
      </Section>

      <Section title="3. Service providers we share data with">
        <p>We use a small number of trusted processors, only as needed to run the service:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Stripe</strong> — payment processing for Pro subscriptions.</li>
          <li><strong>Google</strong> — optional &ldquo;Sign in with Google&rdquo; authentication.</li>
          <li><strong>Supabase</strong> — secure database hosting for your account and content.</li>
          <li><strong>Hostinger</strong> — application hosting and outgoing email delivery.</li>
          <li><strong>Web Push services</strong> (your browser/OS vendor, e.g. Apple, Google, Mozilla) — to deliver reminder notifications.</li>
        </ul>
        <p>We do not share your data with advertisers and we do not sell it.</p>
      </Section>

      <Section title="4. Cookies & analytics">
        <p>
          We use a strictly necessary session cookie to keep you signed in and to remember your language.
          We do not use third-party advertising or cross-site tracking cookies.
        </p>
      </Section>

      <Section title="5. Data retention & deletion">
        <p>
          We keep your data for as long as your account exists. You can delete your account at any time from
          <strong> Settings</strong>. When you request deletion, your account is scheduled for removal and kept for
          a 30-day grace period (so you can change your mind by signing back in). After 30 days, your account and
          all related data are permanently erased.
        </p>
      </Section>

      <Section title="6. Your rights">
        <p>
          Depending on your location (including under the EU/UK GDPR), you have the right to access, correct,
          export, or delete your personal data, and to object to or restrict certain processing. You can export
          your data and delete your account directly in Settings, or contact us for any other request.
        </p>
      </Section>

      <Section title="7. Children">
        <p>Phantom Tracker is not directed at children under 16, and we do not knowingly collect their data.</p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          We may update this policy as the product evolves. We&apos;ll update the &ldquo;Last updated&rdquo; date above,
          and for material changes we&apos;ll notify you in-app or by email.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>
          Questions about your privacy? Email us at{" "}
          <a href={`mailto:${CONTACT}`} className="text-primary hover:underline">{CONTACT}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
