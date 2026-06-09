import type { Metadata } from "next";
import { LegalPage, Section } from "@/components/legal/legal-page";

const CONTACT = "support@phantomtracker.io";
const UPDATED = "June 10, 2026";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using Phantom Tracker.",
  alternates: { canonical: "/tos" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <p>
        These Terms govern your use of Phantom Tracker (the &ldquo;Service&rdquo;). By creating an account or
        using the Service, you agree to these Terms. If you don&apos;t agree, please don&apos;t use the Service.
      </p>

      <Section title="1. Your account">
        <ul className="list-disc pl-5 space-y-1">
          <li>You&apos;re responsible for your account, your password, and the activity under it.</li>
          <li>Provide accurate information and keep your credentials secure.</li>
          <li>You must be at least 16 years old to use the Service.</li>
        </ul>
      </Section>

      <Section title="2. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Use the Service for anything illegal, abusive, or harmful.</li>
          <li>Attempt to break, overload, reverse-engineer, or gain unauthorized access to the Service.</li>
          <li>Use automated or bulk methods to access the Service except as we explicitly allow.</li>
        </ul>
        <p>We may suspend or terminate accounts that violate these Terms.</p>
      </Section>

      <Section title="3. Free & Pro plans">
        <ul className="list-disc pl-5 space-y-1">
          <li>The free plan lets you track up to a set number of active habits at no cost.</li>
          <li><strong>Pro</strong> unlocks unlimited habits, reminders, advanced stats and other perks for a recurring fee (currently €2/month or €15/year), with a 14-day free trial for new subscribers.</li>
          <li>Subscriptions renew automatically until cancelled. You can cancel any time from the billing portal; access continues until the end of the paid period.</li>
          <li>If your Pro plan ends and you&apos;re over the free limit, extra habits are locked (kept safe, hidden) until you choose which to keep or re-subscribe. Nothing is deleted.</li>
        </ul>
      </Section>

      <Section title="4. Payments & refunds">
        <p>
          Payments are processed securely by Stripe. Prices may change, and we&apos;ll give notice of changes that
          affect an active subscription. Except where required by law (including mandatory EU consumer rights),
          fees already paid are generally non-refundable. For refund questions, contact us.
        </p>
      </Section>

      <Section title="5. Your content">
        <p>
          You own the habits and data you create. You grant us only the limited rights needed to store and display
          it back to you and operate the Service. You can export or delete your data at any time from Settings.
        </p>
      </Section>

      <Section title="6. Service availability">
        <p>
          We work hard to keep the Service running and may add, change, or remove features over time. The Service
          is provided <strong>&ldquo;as is&rdquo;</strong> and <strong>&ldquo;as available&rdquo;</strong> without warranties of any kind. We don&apos;t
          guarantee it will always be available, error-free, or fit a particular purpose.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Phantom Tracker is not liable for indirect, incidental, or
          consequential damages, or for loss of data or profits. Our total liability is limited to the amount you
          paid us in the 12 months before the claim (or €50 if you paid nothing).
        </p>
      </Section>

      <Section title="8. Termination">
        <p>
          You may stop using the Service and delete your account at any time. We may suspend or terminate access if
          you breach these Terms or to protect the Service and its users.
        </p>
      </Section>

      <Section title="9. Governing law">
        <p>
          These Terms are governed by the laws of the operator&apos;s country of residence, without regard to
          conflict-of-law rules. Mandatory consumer protections in your country of residence still apply.
        </p>
      </Section>

      <Section title="10. Changes to these Terms">
        <p>
          We may update these Terms as the product evolves. We&apos;ll update the &ldquo;Last updated&rdquo; date above and,
          for material changes, give reasonable notice in-app or by email. Continued use after changes means you
          accept the updated Terms.
        </p>
      </Section>

      <Section title="11. Contact">
        <p>
          Questions about these Terms? Email us at{" "}
          <a href={`mailto:${CONTACT}`} className="text-primary hover:underline">{CONTACT}</a>.
        </p>
      </Section>
    </LegalPage>
  );
}
