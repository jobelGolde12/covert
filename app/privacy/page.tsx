"use client";

import { useEffect, useRef, useState } from "react";
import type { Metadata } from "next";

// Since this needs to be a client component for scroll tracking,
// we'll define the metadata separately
const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Convert handles your documents, data, and privacy.",
  alternates: {
    canonical: "/privacy",
  },
};

// Define the policy sections data structure for better maintainability
const POLICY_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    content: (
      <p>
        Convert is a document conversion service. We collect the minimum data
        needed to provide the service and do not sell or monetize your personal
        information.
      </p>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    content: (
      <p>
        When you use Convert without signing in, we do not collect personally
        identifiable information. Anonymous usage data (conversion count, file
        type) is tracked via a browser-generated identifier to enforce rate
        limits. If you create an account, we store your email address and
        authentication credentials.
      </p>
    ),
  },
  {
    id: "how-we-use-data",
    title: "How we use your data",
    content: (
      <p>
        Your data is used solely to operate the service: converting your files,
        enforcing quotas, and communicating account-related information. We do
        not use your documents for training, advertising, or any purpose other
        than delivering the conversion you requested.
      </p>
    ),
  },
  {
    id: "file-handling",
    title: "File handling",
    content: (
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
    ),
  },
  {
    id: "cookies-local-storage",
    title: "Cookies and local storage",
    content: (
      <p>
        Convert uses essential cookies for session management and anonymous
        rate-limit tracking. We do not use advertising or analytics cookies.
        Local storage is used to remember your preferences and conversion
        history on your device.
      </p>
    ),
  },
  {
    id: "third-party-services",
    title: "Third-party services",
    content: (
      <p>
        Convert may use third-party infrastructure for file processing. These
        providers are bound by data-processing agreements and are only
        authorized to handle your files for the purpose of conversion. We do
        not share personal data with third parties for marketing or analytics
        purposes.
      </p>
    ),
  },
  {
    id: "data-security",
    title: "Data security",
    content: (
      <p>
        We use industry-standard encryption in transit (TLS) and at rest. Access
        controls, least-privilege policies, and regular security reviews are
        part of our operational practices.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    content: (
      <p>
        You can request access to, correction of, or deletion of any personal
        data we hold about you. Because Convert collects very little personal
        data, these requests are typically resolved quickly.
      </p>
    ),
  },
  {
    id: "changes-to-policy",
    title: "Changes to this policy",
    content: (
      <p>
        We may update this policy as the service evolves. Material changes will
        be reflected on this page with an updated date. Continued use of
        Convert after changes constitutes acceptance of the revised policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    content: (
      <p>
        Questions about this privacy policy? Write to{" "}
        <a
          href="mailto:support@convert.app"
          className="text-foreground underline underline-offset-4 hover:text-accent transition-colors duration-200"
        >
          support@convert.app
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState<string>("overview");
  const [isTocVisible, setIsTocVisible] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({});
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for scroll spy functionality
  useEffect(() => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Create new observer with optimal settings for scroll spy
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -70% 0px", // Trigger when section is in the optimal reading area
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all sections
    POLICY_SECTIONS.forEach((section) => {
      const element = sectionRefs.current[section.id];
      if (element) {
        observerRef.current?.observe(element);
      }
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  // Smooth scroll to section with offset for sticky header
  const scrollToSection = (id: string) => {
    const element = sectionRefs.current[id];
    if (element) {
      const headerOffset = 80; // Adjust based on your header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update active section immediately for better UX
      setActiveSection(id);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        <div className="flex gap-8 lg:gap-12">
          {/* Main content area */}
          <div className="flex-1 max-w-3xl py-12 md:py-16">
            {/* Header */}
            <header className="mb-12">
              <p className="text-sm font-medium text-accent mb-2">
                Privacy
              </p>
              <h1 className="text-4xl md:text-5xl font-semibold tracking-tight text-foreground mb-4">
                Privacy Policy
              </h1>
              <p className="text-sm text-muted">
                Last updated: August 17, 2026
              </p>
            </header>

            {/* Content sections */}
            <div className="space-y-12">
              {POLICY_SECTIONS.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  ref={(el) => {
                    sectionRefs.current[section.id] = el;
                  }}
                  className="scroll-mt-24"
                >
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">
                    {section.title}
                  </h2>
                  <div className="text-body leading-relaxed text-muted">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Table of Contents - Desktop */}
          <aside className="hidden lg:block w-64 shrink-0 py-16">
            <div className="sticky top-24">
              <nav aria-label="Table of contents">
                <h3 className="text-sm font-semibold text-foreground mb-4 uppercase tracking-wider">
                  On this page
                </h3>
                <ul className="space-y-1 border-l-2 border-gray-200">
                  {POLICY_SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`
                            w-full text-left px-4 py-2 text-sm transition-all duration-200
                            cursor-pointer rounded-r-lg
                            border-l-2 -ml-0.5
                            ${isActive
                              ? "border-accent text-accent font-medium bg-accent/5"
                              : "border-transparent text-muted hover:text-foreground hover:border-gray-300"
                            }
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                          `}
                          aria-current={isActive ? "location" : undefined}
                        >
                          {section.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Table of Contents - Floating button */}
      <button
        onClick={() => setIsTocVisible(!isTocVisible)}
        className="
          lg:hidden fixed bottom-6 right-6 z-40
          h-14 w-14 rounded-full bg-accent text-white
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          hover:scale-105 active:scale-95
          flex items-center justify-center
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        "
        aria-label="Toggle table of contents"
        aria-expanded={isTocVisible}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-300"
          style={{ transform: isTocVisible ? "rotate(90deg)" : "none" }}
        >
          <path
            d="M4 6h16M4 12h16M4 18h16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Mobile Table of Contents - Slide out panel */}
      {isTocVisible && (
        <div className="lg:hidden fixed inset-0 z-30">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsTocVisible(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-background shadow-2xl">
            <div className="p-6 pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">
                  On this page
                </h3>
                <button
                  onClick={() => setIsTocVisible(false)}
                  className="
                    h-10 w-10 flex items-center justify-center rounded-lg
                    text-muted hover:text-foreground hover:bg-foreground/5
                    transition-all duration-200 cursor-pointer
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                  "
                  aria-label="Close table of contents"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M5 5l10 10M15 5L5 15"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
              
              <nav aria-label="Table of contents">
                <ul className="space-y-1">
                  {POLICY_SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => {
                            scrollToSection(section.id);
                            setIsTocVisible(false);
                          }}
                          className={`
                            w-full text-left px-4 py-3 text-sm rounded-lg transition-all duration-200
                            cursor-pointer
                            ${isActive
                              ? "bg-accent/10 text-accent font-medium"
                              : "text-muted hover:text-foreground hover:bg-foreground/5"
                            }
                            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                          `}
                          aria-current={isActive ? "location" : undefined}
                        >
                          {section.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}