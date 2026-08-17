import type { Metadata } from "next";

import { PolicyPage, PolicySection } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of Convert's document conversion service.",
};

export default function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Terms"
      title="Terms of Service"
      updated="Last updated: August 17, 2026"
    >
      <PolicySection title="The service">
        <p>
          Convert converts documents between Word, PDF, PowerPoint, Excel, images, HTML,
          Markdown and text. Some conversions run entirely in your browser; others are
          processed on our servers and deleted automatically. By using Convert you agree to
          these terms.
        </p>
      </PolicySection>

      <PolicySection title="Your content">
        <p>
          You keep all rights to the documents you convert. You are responsible for the files
          you upload and for having the right to process them. To provide the service, you
          grant Convert a limited, non-exclusive license to transmit, store, and convert your
          files — nothing more. Uploaded files are deleted automatically and are never used for
          any other purpose.
        </p>
      </PolicySection>

      <PolicySection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Upload unlawful, infringing, or malicious content.</li>
          <li>
            Attempt to disrupt the service, probe its infrastructure, or interfere with other
            users&apos; conversions.
          </li>
          <li>
            Circumvent rate limits, quotas, or the guest identity system used to enforce them.
          </li>
          <li>Attempt to access files or download links that belong to other users.</li>
        </ul>
      </PolicySection>

      <PolicySection title="Quotas and limits">
        <p>
          Anonymous visitors get 5 conversions per day and uploads up to 25 MB — no account
          needed. Browser-side tools handle much larger files since nothing is uploaded. We may
          adjust these limits as the service evolves; changes will be reflected on this page.
        </p>
      </PolicySection>

      <PolicySection title="Conversion quality">
        <p>
          We use reliable conversion engines and test them continuously, but automated
          conversion can&apos;t be perfect: complex layouts, unusual fonts, and scanned pages
          may convert with reduced fidelity. Always review important output before relying on
          it.
        </p>
      </PolicySection>

      <PolicySection title="Availability and changes">
        <p>
          The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. We may
          change features, limits, or pricing, and we may suspend or discontinue the service.
          To the extent permitted by law, Convert is not liable for indirect, incidental, or
          consequential damages arising from use of the service.
        </p>
      </PolicySection>

      <PolicySection title="Contact">
        <p>
          Questions about these terms? Write to{" "}
          <a href="mailto:support@convert.app" className="text-foreground underline underline-offset-4 hover:text-accent">
            support@convert.app
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
