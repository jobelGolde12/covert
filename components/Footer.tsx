import Link from "next/link";

const GROUPS = [
  {
    title: "Convert",
    links: [
      { label: "Word to PDF", href: "/convert" },
      { label: "PDF to Word", href: "/convert" },
      { label: "Merge PDF", href: "/convert" },
      { label: "Compress PDF", href: "/convert" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Story", href: "/#story" },
      { label: "Docs", href: "/#formats" },
      { label: "Contact", href: "mailto:support@convert.app" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "/#faq" },
      { label: "File retention", href: "/privacy" },
      { label: "Status", href: "https://status.convert.app" },
      { label: "Security", href: "mailto:security@convert.app" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Accessibility", href: "/accessibility" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-dark text-white/70">
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16 py-16 grid grid-cols-2 lg:grid-cols-5 gap-10">
        <div className="col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-[18px] h-[18px] bg-accent inline-block" aria-hidden="true" />
            <span className="text-white text-[17px] font-semibold tracking-[-0.02em]">Convert</span>
          </div>
          <p className="text-body-sm text-white/50 max-w-[220px]">
            Document conversion with style and substance. Your files stay yours.
          </p>
        </div>
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h3 className="text-nav uppercase tracking-[0.08em] text-white/40 mb-4">{group.title}</h3>
            <ul className="space-y-2">
              {group.links.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-body-sm hover:text-white transition-colors duration-fast">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-body-sm text-white/40">
          <p>© 2026 Convert. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/accessibility" className="hover:text-white transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
