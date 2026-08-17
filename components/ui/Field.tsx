import type { ReactNode } from "react";

/**
 * Labelled form control wrapper. Pairs every control with an explicit
 * `<label>` (click-to-focus included) and optional hint copy.
 */
interface FieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, htmlFor, hint, className = "", children }: FieldProps) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1 block text-nav font-semibold uppercase tracking-[0.08em] text-muted"
      >
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

/**
 * Shared control chrome for text inputs, selects and textareas. Sized for
 * 40px height (the surrounding page padding keeps the field itself clear of
 * the 44px minimum; use for compact inline controls).
 */
export const controlClass =
  "h-10 w-full border border-border bg-background px-3 text-[15px] text-foreground " +
  "placeholder:text-muted/60 transition-colors duration-fast " +
  "focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60";
