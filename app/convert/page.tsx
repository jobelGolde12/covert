import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { ConverterWorkspace } from "@/components/convert/ConverterWorkspace";
import { AdContainer } from "@/components/ads/AdContainer";

export const metadata: Metadata = {
  title: "Convert documents",
  description:
    "Convert Word, PDF, PowerPoint, Excel, images, HTML and Markdown. Browser-side tools run on your device; server conversions are auto-deleted.",
  alternates: {
    canonical: "/convert",
  },
  openGraph: {
    title: "Convert documents — Convert",
    description:
      "Convert Word, PDF, PowerPoint, Excel, images, HTML and Markdown. Browser-side tools run on your device; server conversions are auto-deleted.",
    type: "website",
  },
};

export default function ConvertPage() {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Responsive gap: standard on mobile, larger on desktop */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        
        {/* Main content area */}
        <div className="flex-1 min-w-0 px-5 md:px-10 lg:pl-16 lg:pr-0 py-12 md:py-16 lg:py-20">
          {/* Header Section */}
          <div className="max-w-[560px] mb-10 md:mb-12">
            {/* Eyebrow label */}
            <Link
              href="/login"
              className="
                group inline-flex items-center gap-2 mb-5
                transition-all duration-200 ease-in-out cursor-pointer
                focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent
                rounded-lg
              "
              aria-label="Convert - Go to login"
            >
              {/* Logo image */}
              <img
                src="/logo.png"
                alt="Convert Logo"
                width={20}
                height={20}
                className="h-5 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                loading="eager"
              />
              <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-light transition-colors duration-200 group-hover:text-accent">
                Converter
              </span>
            </Link>

            {/* Main heading */}
            <h1 className="text-h1 text-foreground text-balance leading-tight tracking-tight">
              Convert your documents.
            </h1>

            {/* Description */}
            <p className="mt-5 text-body text-muted leading-relaxed">
              Drop a file, pick a format. Tools marked{" "}
              <span className="text-accent font-semibold cursor-help border-b border-dotted border-accent/40 hover:border-accent">
                on device
              </span>{" "}
              run entirely in your browser; everything else is processed securely
              and deleted automatically.
            </p>
          </div>

          {/* Converter Workspace */}
          <Suspense
            fallback={
              <div
                className="
                  border-2 border-dashed border-border rounded-xl h-[256px]
                  flex items-center justify-center
                  animate-pulse
                "
                aria-hidden="true"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted">Loading converter...</span>
                </div>
              </div>
            }
          >
            <div className="relative">
              <ConverterWorkspace />
            </div>
          </Suspense>

          {/* Quick help section */}
          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-muted">
            <div className="flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-accent shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 11.5V8"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="5.5" r="1" fill="currentColor" />
              </svg>
              <span>
                Need help? Check our{" "}
                <Link
                  href="/#formats"
                  className="
                    text-accent font-medium
                    transition-all duration-200 ease-in-out cursor-pointer
                    hover:opacity-80 underline decoration-accent/30 underline-offset-4
                    hover:decoration-accent
                    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                    rounded
                  "
                >
                  supported formats
                </Link>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-accent shrink-0"
                aria-hidden="true"
              >
                <path
                  d="M8 14.5C11.5899 14.5 14.5 11.5899 14.5 8C14.5 4.41015 11.5899 1.5 8 1.5C4.41015 1.5 1.5 4.41015 1.5 8C1.5 11.5899 4.41015 14.5 8 14.5Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 8V5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="8" cy="11.5" r="1" fill="currentColor" />
              </svg>
              <span>Your files are deleted automatically after conversion</span>
            </div>
          </div>
        </div>

        {/* Ad Container - Sticky right sidebar */}
        <aside className="w-full px-5 md:px-10 pb-12 lg:w-[40%] lg:shrink-0 lg:px-0 lg:pb-0 lg:sticky lg:top-0 lg:h-screen lg:flex lg:justify-end">
          <AdContainer />
        </aside>
        
      </div>
    </div>
  );
}