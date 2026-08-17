"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { label: "Convert", href: "/convert" },
  { label: "Formats", href: "/#formats" },
  { label: "Privacy", href: "/#privacy" },
  { label: "Story", href: "/#story" },
];

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Folio home">
      <span className="w-[18px] h-[18px] bg-accent inline-block" aria-hidden="true" />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">Folio</span>
    </Link>
  );
}

/** Compact professional header — design.md §6: white, thin border, small nav, dark CTA. */
export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  // Scroll progress hairline under the header. Mutates the DOM directly so a
  // scroll handler never triggers a re-render. Skipped under reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        if (progressRef.current) {
          progressRef.current.style.width = `${max > 0 ? (doc.scrollTop / max) * 100 : 0}%`;
        }
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Escape closes the panel and releases the scroll lock.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Focus the panel's first link on open; return focus to the toggle on close.
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    } else if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);

  const isActive = (href: string) => href === "/convert" && pathname === "/convert";

  return (
    <header className="sticky top-0 z-40 border-b hairline bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-5 md:px-10 lg:px-16">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`text-nav transition-colors duration-fast ${
                  active ? "text-accent" : "text-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Button href="/convert" variant="primary" size="sm" className="hidden md:inline-flex">
            Start converting
          </Button>
          <button
            ref={toggleRef}
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center text-foreground md:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon name={open ? "close" : "menu"} size={20} />
          </button>
        </div>
      </div>

      {/* scroll progress hairline */}
      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 block h-px w-0 bg-accent"
      />

      {/* mobile panel — design.md §16 */}
      {open && (
        <nav
          id="mobile-nav"
          ref={panelRef}
          className="border-t hairline bg-background md:hidden"
          aria-label="Mobile"
        >
          <div className="mx-auto flex max-w-container flex-col gap-1 px-5 py-4">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`border-b py-3 text-body hairline last:border-none ${
                  isActive(item.href) ? "text-accent" : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Button
              href="/convert"
              fullWidth
              size="lg"
              className="mt-3"
              onClick={() => setOpen(false)}
            >
              Start converting
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
