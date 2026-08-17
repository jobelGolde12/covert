import type { Metadata } from "next";

import { PolicyPage, PolicySection } from "@/components/legal/PolicyPage";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "Convert's commitment to an accessible experience — keyboard support, screen readers, reduced motion, and WCAG 2.1 AA-conscious design.",
  alternates: {
    canonical: "/accessibility",
  },
};

export default function AccessibilityPage() {
  return (
    <PolicyPage
      eyebrow="Accessibility"
      title="Built to be usable by everyone."
      updated="Last updated: August 17, 2026"
    >
      <PolicySection title="Our approach">
        <p>
          Convert is designed toward the WCAG 2.1 AA guidelines. Accessibility is treated as a
          core requirement of the design system, not a polish pass — every component ships
          with semantic structure, keyboard behavior, and reduced-motion support built in.
        </p>
      </PolicySection>

      <PolicySection title="What we&apos;ve built">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="font-medium text-foreground">Keyboard operation</strong> — every
            control is reachable and operable with Tab, Enter, and Space, including the
            drag-and-drop area and the mobile menu (Escape closes it and returns focus).
          </li>
          <li>
            <strong className="font-medium text-foreground">Screen readers</strong> — semantic
            landmarks, a skip-to-content link, descriptive alt text on images, and live
            regions that announce conversion progress and results.
          </li>
          <li>
            <strong className="font-medium text-foreground">Visible focus</strong> — a clear
            focus indicator on every interactive element, never removed, never
            color-dependent.
          </li>
          <li>
            <strong className="font-medium text-foreground">Touch targets</strong> — primary
            controls are at least 44&nbsp;px tall, and the converter&apos;s dropzone is a
            single large target.
          </li>
          <li>
            <strong className="font-medium text-foreground">Reduced motion</strong> — all
            animations, reveals, and transitions collapse to instant states when
            <code className="text-foreground"> prefers-reduced-motion</code> is set.
          </li>
          <li>
            <strong className="font-medium text-foreground">Contrast</strong> — near-black text
            on a white canvas with the red accent reserved for labels and states, keeping
            text legible at AA-conscious contrast levels.
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="Known limitations">
        <p>
          A few compact controls (small utility buttons) are 36–40&nbsp;px tall, below the
          preferred 44&nbsp;px touch target. Light gray text is used for quiet metadata and may
          fall short of AA at very small sizes. We&apos;re working to close both gaps.
        </p>
      </PolicySection>

      <PolicySection title="Report an issue">
        <p>
          If you encounter an accessibility barrier, please tell us. Include the page, your
          browser, and the assistive technology you use — we&apos;ll fix it and keep you
          posted. Write to{" "}
          <a href="mailto:support@convert.app" className="text-foreground underline underline-offset-4 hover:text-accent">
            support@convert.app
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  );
}
