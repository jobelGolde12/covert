import Link from "next/link";

const GROUPS = [
  {
    title: "Convert",
    links: [
      { label: "Word to PDF", href: "/convert?tool=docx-pdf" },
      { label: "PDF to Word", href: "/convert?tool=pdf-docx" },
      { label: "Merge PDF", href: "/convert?tool=pdf-merge" },
      { label: "Compress PDF", href: "/convert?tool=pdf-compress" },
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
    <footer className="bg-dark text-white/70" role="contentinfo">
      {/* Main footer content */}
      <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16 py-16 lg:py-20 grid grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
        {/* Brand section - improved with logo image and better spacing */}
        <div className="col-span-2 lg:col-span-2">
          <Link 
            href="/login" 
            className="group inline-flex items-center gap-2.5 mb-5 transition-opacity duration-200 hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white rounded-lg"
            aria-label="Convert - Go to login"
          >
            {/* Logo image with proper dimensions */}
            <img 
              src="/logo.png" 
              alt="Convert Logo" 
              width={28} 
              height={28} 
              className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
              loading="lazy"
            />
            <span className="text-white text-[17px] font-semibold tracking-[-0.02em] leading-none">
              Convert
            </span>
          </Link>
          <p className="text-body-sm text-white/50 max-w-[260px] leading-relaxed">
            Document conversion with style and substance. Your files stay yours.
          </p>
        </div>

        {/* Navigation groups */}
        {GROUPS.map((group) => (
          <nav key={group.title} aria-label={`${group.title} links`}>
            <h3 className="text-nav uppercase tracking-[0.08em] text-white/40 mb-5 font-medium">
              {group.title}
            </h3>
            <ul className="space-y-3">
              {group.links.map((link) => {
                const isExternal = link.href.startsWith("http");
                const isMailto = link.href.startsWith("mailto:");
                
                return (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className={`
                        group inline-flex items-center gap-1.5 text-body-sm 
                        transition-all duration-200 ease-in-out cursor-pointer
                        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
                        hover:text-white hover:translate-x-0.5
                      `}
                      {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      {/* Animated underline effect */}
                      <span className="relative">
                        {link.label}
                        <span 
                          className="
                            absolute -bottom-0.5 left-0 h-px w-full origin-left transform bg-white/70
                            transition-transform duration-200 ease-in-out scale-x-0 group-hover:scale-x-100
                          " 
                          aria-hidden="true"
                        />
                      </span>
                      
                      {/* External link indicator - using arrow icon or arrow-up-right if available */}
                      {isExternal && (
                        <svg 
                          width="12" 
                          height="12" 
                          viewBox="0 0 12 12" 
                          fill="none" 
                          xmlns="http://www.w3.org/2000/svg"
                          className="opacity-40 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          aria-hidden="true"
                        >
                          <path 
                            d="M3.5 8.5L8.5 3.5M8.5 3.5H4M8.5 3.5V8" 
                            stroke="currentColor" 
                            strokeWidth="1.5" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ))}
      </div>

      {/* Bottom bar - improved with better visual hierarchy */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-container px-5 md:px-10 lg:px-16 py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-body-sm text-white/40">
          <p className="leading-relaxed">
            © 2026 Convert. All rights reserved.
          </p>
          
          {/* Bottom links with consistent hover states */}
          <nav aria-label="Legal links">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { label: "Privacy", href: "/privacy" },
                { label: "Terms", href: "/terms" },
                { label: "Accessibility", href: "/accessibility" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="
                      group relative inline-block
                      transition-all duration-200 ease-in-out cursor-pointer
                      hover:text-white hover:opacity-100
                      focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
                    "
                  >
                    {link.label}
                    {/* Subtle underline animation */}
                    <span 
                      className="
                        absolute -bottom-0.5 left-0 h-px w-full origin-left transform bg-white/70
                        transition-transform duration-200 ease-in-out scale-x-0 group-hover:scale-x-100
                      " 
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}