import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { publicCatalog, type Category } from "@/lib/conversions";

const CATEGORY_LABEL: Record<Category, string> = {
  "office-to-pdf": "Office → PDF",
  "pdf-to-office": "PDF → Office",
  "office-to-office": "Office → Office",
  "pdf-tools": "PDF tools — on your device",
  image: "Images",
  text: "Text",
  web: "Web & text → PDF",
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
    items: conversions.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <section id="formats" className="bg-surface py-20 md:py-30" aria-labelledby="formats-heading">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-16">
          <h2 id="formats-heading" className="text-h2 md:text-[40px] text-foreground max-w-[520px]">
            Built for the way you work.
          </h2>
          <p className="text-body-sm text-muted max-w-[300px]">
            Twenty-eight conversions. The ones marked{" "}
            <span className="text-accent font-semibold">on your device</span> never upload a byte.
          </p>
        </div>

        {/* editorial directory — design.md §15: numbered rows, hairline dividers, no cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-20">
          {groups.map((group, i) => (
            <Reveal key={group.category} delay={i * 60} className="min-w-0">
              <h3 className="mb-5 text-nav uppercase tracking-[0.12em] text-light">
                {group.label}
              </h3>
              <div className="border-t hairline divide-y divide-border">
                {group.items.map((c, j) => (
                  <ConversionRow key={c.id} conversion={c} index={j + 1} />
                ))}
              </div>
            </Reveal>
          ))}
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
      className="group flex items-start justify-between gap-6 py-5"
      aria-label={`${conversion.label} — open converter`}
    >
      <div className="flex min-w-0 gap-4">
        <span
          className="pt-0.5 text-[11px] tabular-nums text-light"
          aria-hidden="true"
        >
          {String(index).padStart(2, "0")}
        </span>
        <div className="min-w-0">
          <h4 className="text-[16px] font-medium tracking-[-0.01em] text-foreground">
            {conversion.shortLabel}
          </h4>
          <p className="mt-1 text-body-sm text-muted max-w-[440px]">
            {conversion.description}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-1">
        {isClient && (
          <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.08em] text-accent">
            On your device
          </span>
        )}
        <Icon
          name="arrow-right"
          size={14}
          aria-hidden="true"
          className="text-muted transition-[transform,color] duration-fast group-hover:translate-x-1 group-hover:text-foreground"
        />
      </div>
    </Link>
  );
}
