import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";

/** Feature strip — the privacy differentiator. design.md §19 style. */
export function FeatureStrip() {
  const features = [
    {
      title: "On your device",
      body: "Merge, split, rotate, watermark, compress, image → PDF and PDF → text run entirely in your browser. Nothing is uploaded, ever.",
    },
    {
      title: "Auto-deleted",
      body: "Server-side conversions are processed in isolated containers and deleted automatically — 1 hour for guests, 24 hours for free accounts.",
    },
    {
      title: "Encrypted",
      body: "Files travel over TLS and rest encrypted in storage. Passwords for protected PDFs are used in memory and never logged.",
    },
  ];
  return (
    <section className="py-16 md:py-20 lg:py-24 border-b hairline" aria-labelledby="privacy-heading">
      <h2 id="privacy-heading" className="sr-only">Privacy</h2>
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col">
              <div className="w-6 h-[3px] bg-accent mb-5" aria-hidden="true" />
              <h3 className="text-h3 text-foreground mb-2">{f.title}</h3>
              <p className="text-body-sm text-muted flex-1">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Brand story — design.md §19. */
export function BrandStory() {
  return (
    <section id="story" className="py-16 md:py-20 lg:py-30" aria-labelledby="story-heading">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10 lg:gap-12">
          <div className="lg:col-span-6">
            <h2 id="story-heading" className="text-h2 md:text-[40px] lg:text-[44px] text-foreground max-w-full lg:max-w-[420px]">
              Designed to make conversions effortless.
            </h2>
          </div>
          <div className="lg:col-span-6 lg:pl-0 xl:pl-12">
            <p className="text-body text-muted max-w-full lg:max-w-[460px]">
              Thoughtful tooling, reliable engines, and a calm interface that gets out of the way.
              We built Convert so the documents you handle every day keep their layout, their fonts,
              and their privacy.
            </p>
            <div className="mt-8 md:mt-10 grid grid-cols-3 gap-4 md:gap-6 max-w-full lg:max-w-[460px]">
              {[
                { n: "28", l: "conversions" },
                { n: "9", l: "on-device tools" },
                { n: "100%", l: "auto-delete" },
              ].map((s, i) => (
                <Reveal key={s.l} delay={i * 80}>
                  <p className="text-h3 md:text-h2 text-foreground">{s.n}</p>
                  <p className="text-[11px] md:text-[12px] text-muted mt-1">{s.l}</p>
                </Reveal>
              ))}
            </div>
            <Button href="#formats" variant="link" iconRight="arrow-right" className="mt-8 md:mt-10">
              Browse all formats
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Conversion CTA — design.md §25: one small label, large invitation, single minimal CTA. */
export function QuoteCTA() {
  return (
    <section className="bg-surface py-16 md:py-20 lg:py-32 text-center" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        <div className="max-w-3xl mx-auto">
          <p className="mb-6 md:mb-8 text-[10px] font-medium uppercase tracking-[0.16em] text-light">
            Free to start
          </p>
          <h2 id="cta-heading" className="text-h2 md:text-[40px] lg:text-[44px] text-foreground text-balance">
            Ready to convert?
          </h2>
          <p className="mt-4 md:mt-5 text-body text-muted max-w-[420px] mx-auto px-4">
            Drop a file and pick a format. Five conversions a day, free — no account needed.
          </p>
          <div className="mt-10 md:mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6 md:gap-10">
            <Button href="/convert" size="md" className="w-full sm:w-auto">
              Start converting
            </Button>
            <Button href="#formats" variant="link" iconRight="arrow-right" className="w-full sm:w-auto">
              Browse formats
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/** FAQ — simple, accessible. */
export function FAQ() {
  const items = [
    {
      q: "Are my files private?",
      a: "Yes. The tools marked \"on your device\" — merge, split, rotate, watermark, compress, image → PDF and PDF → text — run entirely in your browser and never upload. Server-side conversions are encrypted in transit and at rest, processed in isolated containers, and deleted automatically within hours.",
    },
    {
      q: "What's the file size limit?",
      a: "Anonymous visitors get 25 MB uploads and 5 conversions a day. Free accounts (sign-up coming in phase two) get 100 MB. Browser-side tools handle much larger files since nothing is uploaded.",
    },
    {
      q: "How is this different from other converters?",
      a: "Most converters upload every file to their servers. Convert keeps the most-used PDF tools entirely on your device — they work offline, are instant, and there is nothing to delete later.",
    },
    {
      q: "Which formats are supported?",
      a: "Word, PDF, PowerPoint, Excel, CSV, RTF, EPUB, HTML, Markdown, plain text, and common image formats — 28 conversions in total, listed above.",
    },
  ];
  return (
    <section id="faq" className="py-16 md:py-20 lg:py-24" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        <div className="max-w-[760px] mx-auto">
          <h2 id="faq-heading" className="text-h2 mb-8 md:mb-10">
            Questions, answered.
          </h2>
          <div className="divide-y divide-border border-y hairline">
            {items.map((item) => (
              <details key={item.q} className="group py-4 md:py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none text-body font-medium text-foreground marker:hidden">
                  <span className="pr-4">{item.q}</span>
                  <Icon
                    name="plus"
                    size={16}
                    className="text-muted transition-transform duration-fast group-open:rotate-45 flex-shrink-0"
                  />
                </summary>
                <p className="mt-3 text-body-sm text-muted max-w-full lg:max-w-[620px]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}