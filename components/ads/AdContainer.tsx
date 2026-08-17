"use client";

import { useState } from "react";
import Link from "next/link";

export function AdContainer() {
  const [isAdReported, setIsAdReported] = useState(false);

  const handleReportAd = () => {
    setIsAdReported(true);
    setTimeout(() => setIsAdReported(false), 3000);
  };

  return (
    <aside 
      className="
        lg:w-[40%] lg:min-w-[400px] lg:max-w-[600px]
        lg:sticky lg:top-0 lg:self-start lg:h-screen
        lg:border-l lg:border-border
        lg:bg-background/50 lg:backdrop-blur-sm
      " 
      aria-label="Advertisement"
    >
      <div className="lg:h-full flex flex-col">
        {/* Ad label */}
        <div className="px-4 py-2 bg-foreground/5 border-b border-border flex items-center justify-between lg:sticky lg:top-0 lg:bg-background lg:z-10">
          <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">
            Advertisement
          </span>
          <button
            className="
              text-muted hover:text-foreground transition-colors duration-200
              focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
              rounded p-1 cursor-pointer
            "
            aria-label={isAdReported ? "Ad reported. Thank you!" : "Report this ad"}
            onClick={handleReportAd}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 1.5L10.5 10.5H1.5L6 1.5Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path
                d="M6 5V8"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <circle cx="6" cy="9.5" r="0.75" fill="currentColor" />
            </svg>
          </button>
        </div>

        {/* Ad content area */}
        <div className="p-4 lg:p-6 lg:flex-1 lg:flex lg:flex-col lg:justify-center">
          {/* Mobile ads */}
          <div className="block sm:hidden">
            <div className="bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-lg p-4 text-center">
              <div className="text-xs text-muted mb-2">320x100</div>
              <div className="h-[100px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <span className="text-sm text-muted">Ad Space</span>
              </div>
            </div>
          </div>

          {/* Tablet ads */}
          <div className="hidden sm:block lg:hidden">
            <div className="bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-lg p-4 text-center">
              <div className="text-xs text-muted mb-2">468x60</div>
              <div className="h-[60px] flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <span className="text-sm text-muted">Ad Space</span>
              </div>
            </div>
          </div>

          {/* Desktop ad - fills the 40% width space */}
          <div className="hidden lg:block lg:flex-1">
            <div className="bg-gradient-to-br from-foreground/5 to-foreground/10 rounded-lg p-6 text-center lg:h-full lg:flex lg:flex-col lg:justify-center">
              <div className="text-xs text-muted mb-4">Responsive Ad</div>
              <div className="lg:flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg min-h-[400px]">
                <div className="text-center">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 48 48"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="mx-auto mb-3 text-muted"
                  >
                    <rect x="6" y="6" width="36" height="36" rx="8" stroke="currentColor" strokeWidth="2"/>
                    <path d="M6 18H42" stroke="currentColor" strokeWidth="2"/>
                    <path d="M18 18V42" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span className="text-sm text-muted">Your Ad Here</span>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {isAdReported && (
            <div className="mt-3 text-center text-xs text-accent animate-pulse">
              Thank you for your feedback!
            </div>
          )}

          {/* Placeholder for actual ad implementation */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted/60 leading-relaxed">
              Your ad could be here.{" "}
              <Link
                href="mailto:ads@convert.app"
                className="
                  text-accent hover:opacity-80 transition-opacity duration-200 cursor-pointer
                  underline decoration-accent/30 underline-offset-2 hover:decoration-accent
                "
              >
                Advertise with us
              </Link>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}