import type { ReactNode } from "react";

/**
 * Compact uppercase status label used on queue items and feature badges.
 */
export type StatusTone = "neutral" | "accent" | "success" | "error" | "active";

const TONES: Record<StatusTone, string> = {
  neutral: "bg-surface text-muted",
  accent: "bg-accent text-white",
  success: "bg-accent/10 text-accent",
  error: "bg-accent/10 text-accent",
  active: "bg-dark text-white",
};

interface StatusPillProps {
  tone?: StatusTone;
  className?: string;
  children: ReactNode;
}

export function StatusPill({ tone = "neutral", className = "", children }: StatusPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-nav font-semibold uppercase tracking-[0.06em] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
