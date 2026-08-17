"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";

const STORAGE_KEY = "convert-cookie-consent";

/**
 * Slim, dismissible cookie notice (mounted in the root layout). Convert sets a
 * single functional cookie for the anonymous conversion quota — no trackers,
 * no ads — so this is an informational notice, not a consent wall. The choice
 * persists in localStorage; Escape or the button dismisses it.
 */
export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* storage unavailable — still show the notice */
    }
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-50 border-t hairline bg-white/95 backdrop-blur"
    >
      <div className="mx-auto flex max-w-container flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between md:px-10 lg:px-16">
        <p className="max-w-[760px] text-body-sm text-muted">
          Convert uses a single functional cookie to enforce the anonymous conversion quota.
          No trackers, no ads.{" "}
          <Link
            href="/privacy"
            className="whitespace-nowrap text-foreground underline underline-offset-4 transition-colors duration-fast hover:text-accent"
          >
            Privacy policy
          </Link>
        </p>
        <Button size="sm" onClick={dismiss} aria-label="Dismiss cookie notice">
          Got it
        </Button>
      </div>
    </div>
  );
}
