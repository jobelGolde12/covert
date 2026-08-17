/* eslint-disable @next/next/no-img-element -- deliberate local SVG artwork */
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const FADE = "animate-fade-up";

/**
 * Hero — design.md §7–§15. Left-aligned editorial composition: tiny eyebrow,
 * oversized thin headline, one dominant art-directed visual on the right that
 * overflows its grid, and a single minimal CTA. No dotted texture, no card,
 * no collage (design.md §17, §45).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-container px-5 md:px-10 lg:px-16 pt-16 md:pt-24 pb-16 md:pb-24">
        <div className="flex flex-col items-center text-center">
          {/* text — centered */}
          <div className="max-w-4xl">
            <p
              className={`${FADE} text-[10px] font-medium uppercase tracking-[0.16em] text-light mb-8`}
              style={{ animationDelay: "60ms" }}
            >
              Document conversion
            </p>
            <h1
              className={`${FADE} text-hero text-foreground`}
              style={{ animationDelay: "140ms" }}
            >
              Convert documents
              <br />
              with style and
              <br />
              substance.
            </h1>
            <p
              className={`${FADE} mt-8 max-w-2xl mx-auto text-body text-muted`}
              style={{ animationDelay: "240ms" }}
            >
              Word, PDF, PowerPoint, Excel and more — in your browser. The tools you use most
              never leave your device.
            </p>
            <div
              className={`${FADE} mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4`}
              style={{ animationDelay: "340ms" }}
            >
              <Button href="/convert" size="md">
                Start converting
              </Button>
              <Link
                href="#formats"
                className="group inline-flex items-center gap-2 text-btn text-foreground transition-colors duration-fast hover:text-muted"
              >
                Browse formats
                <Icon
                  name="arrow-right"
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-fast group-hover:translate-x-1"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}