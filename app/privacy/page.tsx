import type { Metadata } from "next";

import { PolicyPage, PolicySection } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Convert handles your documents, data, and privacy.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="Last updated: August 17, 2026"
    >
      <PolicySection title="Overview">
        <p>
          Convert is a document conversion service. We collect the minimum data
          needed to provide the service and do not sell or monetize your personal
          information.
        </p>
      </PolicySection>

      <PolicySection title="What we collect">
        <p>
          When you use Convert without signing in, we do not collect personally
          identifiable information. Anonymous usage data (conversion count, file
          type) is tracked via a browser-generated identifier to enforce rate
          limits. If you create an account, we store your email address and
          authentication credentials.
        </p>
      </PolicySection>

      <PolicySection title="How we use your data">
        <p>
          Your data is used solely to operate the service: converting your files,
          enforcing quotas, and communicating account-related information. We do
          not use your documents for training, advertising, or any purpose other
          than delivering the conversion you requested.
        </p>
      </PolicySection>

      <PolicySection title="File handling">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Uploaded files are processed and deleted automatically after
            conversion. They are not stored long-term.
          </li>
          <li>
            Browser-side conversions never leave your device — no file data is
            transmitted to our servers.
          </li>
          <li>
            We do not access, read, or share your documents for any purpose
            other than performing the conversion.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Cookies and local storage">
        <p>
          Convert uses essential cookies for session management and anonymous
          rate-limit tracking. We do not use advertising or analytics cookies.
          Local storage is used to remember your preferences and conversion
          history on your device.
        </p>
      </PolicySection>

      <PolicySection title="Third-party services">
        <p>
          Convert may use third-party infrastructure for file processing. These
          providers are bound by data-processing agreements and are only
          authorized to handle your files for the purpose of conversion. We do
          not share personal data with third parties for marketing or analytics
          purposes.
        </p>
      </PolicySection>

      <PolicySection title="Data security">
        <p>
          We use industry-standard encryption in transit (TLS) and at rest. Access
          controls, least-privilege policies, and regular security reviews are
          part of our operational practices.
        </p>
      </PolicySection>

      <PolicySection title="Your rights">
        <p>
          You can request access to, correction of, or deletion of any personal
          data we hold about you. Because Convert collects very little personal
          data, these requests are typically resolved quickly.
        </p>
      </PolicySection>

      <PolicySection title="Changes to this policy">
        <p>
          We may update this policy as the service evolves. Material changes will
          be reflected on this page with an updated date. Continued use of
          Convert after changes constitutes acceptance of the revised policy.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          Questions about this privacy policy? Write to{" "}
          <a
            href="mailto:support@convert.app"
            className="text-foreground underline underline-offset-4 hover:text-accent"
          >
            support@convert.app
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
