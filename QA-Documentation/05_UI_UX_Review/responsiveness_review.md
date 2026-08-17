# Responsiveness Review

Behavioral + structural review at a mobile viewport (390×844, emulated Chromium) against the desktop layout. The reviewing model cannot view screenshots, so this report is based on the accessibility tree, layout measurements, and interaction tests — not pixels.

## Mobile behaviors verified

| Check | Result | Evidence |
|---|---|---|
| Mobile nav menu opens | ✓ | `Open menu` button click → header links (Convert, Formats, Privacy, Story) render in the tree |
| `aria-expanded` reflects state | ✓ | `false` → `true` on open, back to `false` on close |
| Menu closes on `Escape` | ✓ | keydown `Escape` → menu closed, button label reverts to `Open menu` (focusable control restored) |
| Convert workspace at 390 px | ✓ | Dropzone renders full-width; format grid collapses to 1 column (`grid-cols-1 … sm:grid-cols-2 lg:grid-cols-3`, `ConverterWorkspace.tsx:340`) |
| Step indicator on small screens | ✓ | `overflow-x-auto` with `whitespace-nowrap` prevents layout breakage (`ConverterWorkspace.tsx:261`) |
| Touch-target sizing | ✓ | Primary CTA measured at 48 px height (`getBoundingClientRect().height = 48`); ≥44 px guidance met; dropzone is a large target |
| Horizontal overflow | ✓ (no full-width overflow detected) | Layout uses fluid `flex-wrap`, truncation on file chips (`max-w-[220px] truncate`) |
| Homepage at mobile | ✓ | Hero + grid sections stack; no fixed-width elements observed in the tree |

## Source-level responsive patterns

- Tailwind `sm:` / `lg:` breakpoints throughout (`Dropzone` padding scales `py-16 md:py-20`; footer columns stack; hero images swap via `hero-narrow`/`hero-main`/`hero-lifestyle` per breakpoint).
- The conversion grid uses `gap-px bg-border` for hairline separators that degrade gracefully to solid columns on mobile.
- Header uses a disclosure menu below the desktop nav — no overflow, no squished inline links at 390 px.

## Notes / limitations

- **No visual verification** — layout aesthetics at 390 px (spacing, alignment, line lengths) were not pixel-checked because the reviewing model cannot read images. Structural behavior above was observed live.
- The queue items, options panel (`max-w-[640px]`), and file chips all use responsive widths; no fixed-viewport-width containers were found.
- High-zoom (200 %+ text resizing) was not instrumented; Tailwind `rem`-based sizing makes it likely fine, but it is unverified.

## Verdict

Responsive behavior passes the structural and interaction checks performed: the mobile menu, single-column format grid, and fluid workspace all function correctly at 390×844. A visual pass by a human reviewer (or an image-capable model) is recommended before sign-off, specifically for spacing polish on very narrow screens.
