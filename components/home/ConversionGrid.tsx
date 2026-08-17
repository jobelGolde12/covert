import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { publicCatalog, type Category } from "@/lib/conversions";

const CATEGORY_LABEL: Record<Category, string> = {
  "office-to-pdf": "Office → PDF",
  "pdf-to-office": "PDF → Office",
  "office-to-office": "Office → Office",
  "pdf-tools": "PDF Tools — On Your Device",
  image: "Images",
  text: "Text",
  web: "Web & Text → PDF",
};

const CATEGORY_ICON: Record<Category, IconName> = {
  "office-to-pdf": "file-text",
  "pdf-to-office": "file-pdf",
  "office-to-office": "file-spreadsheet",
  "pdf-tools": "wrench",
  image: "image",
  text: "align-left",
  web: "globe",
};

const CATEGORY_ORDER: Category[] = [
  "office-to-pdf",
  "pdf-to-office",
  "office-to-office",
  "pdf-tools",
  "image",
  "text",
  "web",
];

export function ConversionGrid() {
  const conversions = publicCatalog();
  const groups = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABEL[cat],
    icon: CATEGORY_ICON[cat],
    items: conversions.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <section id="formats" className="bg-surface py-16 md:py-20 lg:py-30" aria-labelledby="formats-heading">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        {/* Header with improved layout */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 md:mb-16">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-light mb-3">
              Conversion Directory
            </p>
            <h2 id="formats-heading" className="text-h2 md:text-[40px] lg:text-[44px] text-foreground max-w-[520px]">
              Built for the way you work.
            </h2>
          </div>
          <div className="flex items-start gap-3 bg-white/5 backdrop-blur-sm rounded-xl px-5 py-4 border border-border/50 max-w-[340px]">
            <Icon name="shield-check" size={20} className="text-accent flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-body-sm text-muted">
              <span className="text-accent font-semibold">On your device</span> tools never upload a byte.
              <span className="block text-[11px] text-light mt-1">{conversions.length} conversions total</span>
            </p>
          </div>
        </div>

        {/* Modern grid with category cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
          {groups.map((group, i) => (
            <Reveal key={group.category} delay={i * 60} className="min-w-0">
              <div className="group relative bg-white/3 backdrop-blur-sm rounded-2xl border border-border/50 hover:border-accent/20 transition-all duration-300 p-6 md:p-8">
                {/* Category header with icon */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Icon name={group.icon} size={16} className="text-accent" aria-hidden="true" />
                  </div>
                  <h3 className="text-nav uppercase tracking-[0.12em] text-light">
                    {group.label}
                  </h3>
                  <span className="ml-auto text-[10px] font-medium text-muted bg-white/5 px-2 py-0.5 rounded-full" aria-label={`${group.items.length} conversions`}>
                    {group.items.length}
                  </span>
                </div>
                
                {/* Conversion items */}
                <div className="border-t hairline divide-y divide-border/50" role="list">
                  {group.items.map((c, j) => (
                    <ConversionRow key={c.id} conversion={c} index={j + 1} />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 md:mt-20 text-center">
          <Link
            href="/convert"
            className="inline-flex items-center gap-2 text-body font-medium text-foreground hover:text-accent transition-colors duration-fast group focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            View all conversion tools
            <Icon
              name="arrow-right"
              size={16}
              className="transition-transform duration-fast group-hover:translate-x-1"
            />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ConversionRow({
  conversion,
  index,
}: {
  conversion: ReturnType<typeof publicCatalog>[number];
  index: number;
}) {
  const isClient = conversion.location === "client";
  return (
    <Link
      href={`/convert?tool=${conversion.id}`}
      className="group flex items-start justify-between gap-4 py-4 hover:bg-white/5 rounded-lg px-3 -mx-3 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
      aria-label={`${conversion.shortLabel} — ${conversion.description}. Open converter.`}
    >
      <div className="flex min-w-0 gap-3 md:gap-4">
        <span
          className="pt-0.5 text-[10px] md:text-[11px] tabular-nums text-light/40 font-mono"
          aria-hidden="true"
        >
          {String(index).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h4 className="text-[15px] md:text-[16px] font-medium tracking-[-0.01em] text-foreground group-hover:text-accent transition-colors duration-fast">
            {conversion.shortLabel}
          </h4>
          <p className="mt-1 text-body-sm text-muted line-clamp-2">
            {conversion.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-3 pt-1">
        {isClient && (
          <span className="whitespace-nowrap text-[9px] md:text-[10px] font-semibold uppercase tracking-[0.08em] text-accent bg-accent/10 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full">
            On your device
          </span>
        )}
        <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white/5 group-hover:bg-accent/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
          <Icon
            name="arrow-right"
            size={12}
            aria-hidden="true"
            className="text-muted group-hover:text-accent transition-colors duration-fast"
          />
        </div>
      </div>
    </Link>
  );
}