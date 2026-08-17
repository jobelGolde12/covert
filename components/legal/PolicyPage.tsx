import type { ReactNode } from "react";

/**
 * Editorial layout for legal / policy pages (privacy, terms, accessibility).
 * Follows design.md: restrained document typography, hairline dividers,
 * no cards, no decoration — reads like a magazine spread.
 */
export function PolicyPage({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16 pt-16 md:pt-24 pb-20 md:pb-32">
      <div className="max-w-[720px]">
        <p className="mb-8 text-[10px] font-medium uppercase tracking-[0.16em] text-light">
          {eyebrow}
        </p>
        <h1 className="text-h1 md:text-[44px] text-foreground">{title}</h1>
        <p className="mt-5 text-body-sm text-muted">{updated}</p>
        <div className="mt-12 border-t hairline">{children}</div>
      </div>
    </div>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b hairline py-10">
      <h2 className="text-[22px] font-medium tracking-[-0.01em] text-foreground">{title}</h2>
      <div className="mt-4 space-y-4 text-body text-muted">{children}</div>
    </section>
  );
}
