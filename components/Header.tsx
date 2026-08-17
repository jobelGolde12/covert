"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const NAV = [
  { label: "Convert", href: "/convert" },
  { label: "Formats", href: "/#formats" },
  { label: "Privacy", href: "/privacy" },
  { label: "Story", href: "/#story" },
];

export function Logo() {
  return (
    <Link 
      href="/login" 
      className="group flex items-center gap-2.5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-lg" 
      aria-label="Convert - Go to login"
    >
      {/* Logo image with proper dimensions and lazy loading */}
      <img 
        src="/logo.png" 
        alt="Convert Logo" 
        width={28} 
        height={28} 
        className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
        loading="eager"
      />
      <span className="text-[17px] font-semibold tracking-[-0.02em] text-foreground leading-none">
        Convert
      </span>
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
      // Slight delay ensures the panel is rendered before focusing
      setTimeout(() => {
        panelRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
      }, 50);
    } else if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus();
    }
  }, [open]);

  const isActive = (href: string) => href === "/convert" && pathname === "/convert";

  return (
    <header 
      className="sticky top-0 z-40 border-b hairline bg-background/95 backdrop-blur" 
      role="banner"
    >
      <div className="mx-auto flex h-16 max-w-container items-center justify-between px-5 md:px-10 lg:px-16">
        <Logo />

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary navigation">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`
                  group relative text-nav transition-all duration-200 ease-in-out cursor-pointer
                  focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent
                  ${active ? "text-accent" : "text-muted hover:text-foreground"}
                `}
              >
                {item.label}
                {/* Animated underline effect for better hover feedback */}
                <span 
                  className={`
                    absolute -bottom-1 left-0 h-px w-full origin-left transform bg-accent
                    transition-transform duration-200 ease-in-out
                    ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                  `}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <Button 
            href="/convert" 
            variant="primary" 
            size="sm" 
            className="hidden md:inline-flex transition-all duration-200 ease-in-out hover:opacity-90 active:scale-[0.98]"
          >
            Start converting
          </Button>
          
          {/* Mobile menu toggle with improved hover/active states */}
          <button
            ref={toggleRef}
            type="button"
            className="
              inline-flex h-11 w-11 items-center justify-center text-foreground md:hidden
              rounded-lg cursor-pointer
              transition-all duration-200 ease-in-out
              hover:bg-foreground/5 active:bg-foreground/10
              focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent
            "
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <Icon 
              name={open ? "close" : "menu"} 
              size={20} 
              className="transition-transform duration-200 ease-in-out"
            />
          </button>
        </div>
      </div>

      {/* Scroll progress hairline */}
      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute bottom-0 left-0 block h-[2px] w-0 bg-accent transition-[width] duration-100 ease-out"
      />

      {/* Mobile panel — design.md §16 */}
      {open && (
        <nav
          id="mobile-nav"
          ref={panelRef}
          className="border-t hairline bg-background shadow-lg md:hidden"
          aria-label="Mobile navigation"
        >
          <div className="mx-auto flex max-w-container flex-col gap-1 px-5 py-4">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`
                    group relative flex items-center justify-between border-b py-3.5 text-body hairline last:border-none
                    cursor-pointer transition-all duration-200 ease-in-out
                    focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent
                    ${active ? "text-accent font-medium" : "text-foreground hover:text-accent"}
                  `}
                >
                  <span className="relative">
                    {item.label}
                    {/* Mobile-specific underline animation */}
                    <span 
                      className={`
                        absolute -bottom-1 left-0 h-px w-full origin-left transform bg-accent
                        transition-transform duration-200 ease-in-out
                        ${active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}
                      `}
                      aria-hidden="true"
                    />
                  </span>
                  {/* Arrow indicator for better affordance */}
                  <Icon 
                    name="arrow-right" 
                    size={16} 
                    className="text-muted opacity-0 transition-all duration-200 ease-in-out group-hover:opacity-100 group-hover:translate-x-1" 
                    aria-hidden="true"
                  />
                </Link>
              );
            })}
            <Button
              href="/convert"
              fullWidth
              size="lg"
              className="mt-4 transition-all duration-200 ease-in-out hover:opacity-90 active:scale-[0.98]"
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