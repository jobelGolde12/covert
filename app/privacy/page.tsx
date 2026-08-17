import type { Metadata } from "next";

import { PolicyPage, PolicySection } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Convert handles your documents: on-device conversions never upload a byte, and server-side files are encrypted and deleted automatically.",
};

export default function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Privacy"
      title="Your documents stay yours."
      updated="Last updated: August 17, 2026"
    >
      <PolicySection title="The short version">
        <p>
          Convert is a document converter built around a simple idea: the tools you use most
          should never upload your files. The PDF tools you reach for every day run entirely in
          your browser, and the conversions that do use our servers are encrypted and deleted
          automatically — no account, no profile, no tracking.
        </p>
      </PolicySection>

      <PolicySection title="On-device tools never upload">
        <p>
          Merge, split, rotate, watermark, compress, image → PDF and PDF → text, Markdown and
          image all run in a Web Worker inside your browser. Your files are processed locally,
          never transmitted, and work offline.
        </p>
      </PolicySection>

      <PolicySection title="Server conversions">
        <p>
          Conversions between Office formats and PDF — as well as HTML, Markdown and text to
          PDF — are processed by a LibreOffice worker on our servers. When you use one of
          these:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Files travel over TLS and are stored encrypted at rest while they wait to be
            processed.
          </li>
          <li>
            Each file is processed in an isolated container and its download link is
            short-lived and signed.
          </li>
          <li>
            Uploaded files are deleted automatically — after 1 hour for anonymous visitors and
            24 hours for free accounts. A background sweeper enforces this.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="What we store">
        <p>
          We store only what the service needs to work: file names and sizes, a record of each
          conversion job, and anonymous usage counters used for rate limiting and the daily
          conversion quota. No account is required, so there is no profile to build. Passwords
          for password-protected PDFs are used in memory and never logged.
        </p>
      </PolicySection>

      <PolicySection title="Cookies and tracking">
        <p>
          We set a single guest cookie that identifies your browser so the anonymous conversion
          quota and rate limits can be enforced fairly. We do not use advertising cookies,
          third-party trackers, or analytics.
        </p>
      </PolicySection>

      <PolicySection title="Retention and deletion">
        <p>
          Uploaded files are removed automatically by the retention sweeper (1 hour anonymous,
          24 hours free accounts). Conversion job records are archived after 90 days and
          contain no file contents. If you want a file gone sooner, simply don&apos;t download
          it — it expires on its own.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          Questions about this policy or your data? Write to{" "}
          <a href="mailto:support@convert.app" className="text-foreground underline underline-offset-4 hover:text-accent">
            support@convert.app
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
