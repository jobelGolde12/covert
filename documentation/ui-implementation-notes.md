# Folio — UI Enhancement: Implementation Notes

Companion to [`ui-design-system.md`](ui-design-system.md). Records what changed, the decisions behind it, the trade-offs, and how to extend it. Covers the **UI enhancement task** from `TODO.md`.

---

## 1. What was delivered

| # | TODO.md requirement | Delivered |
| --- | --- | --- |
| 1 | Component library structure | `components/ui/`: `Button`, `Icon`, `Field`, `Skeleton`, `StatusPill`, `Reveal` |
| 2 | CSS custom properties for theme values | `:root` token block in `globals.css` wired into `tailwind.config.ts` |
| 3 | State management for theme/UI | Already Zustand (`lib/convert-store.ts`) for queue; theme stays single-theme per `design.md` (see §3.4) |
| 4 | Consistent buttons, inputs, focus, loading states | Buttons/inputs unified; catalogue skeleton; error banner with retry; per-item status pills |
| 5 | Form-state feedback + states | Step indicator, selected-tile check, `disabled`/press states on all primitives, `role="alert"` errors, `aria-live` announcements |
| 6 | Active nav state | `aria-current="page"` + accent tint on `/convert` |
| 7 | Accessibility & interaction polish | Single-interactive dropzone, paste support, 44px targets, Escape/scroll-lock/focus-return on the mobile menu, contrast-checked tints |
| 8 | Responsive, mobile-first, reduced motion | Verified (§5); all motion respects `prefers-reduced-motion` |
| 9 | Design-system + implementation docs | `ui-design-system.md`, this file |

---

## 2. Key decisions and trade-offs

### 2.1 Color tokens as RGB triplets with `<alpha-value>`

Tailwind **3.4 silently drops** opacity-modifier utilities (`bg-accent/40`) when a config color is a raw `var(--color-accent)` — confirmed by reproduction. The working v3 pattern is `rgb(var(--color-accent) / <alpha-value>)` with the var holding space-separated channels. Plain CSS must therefore use `rgb(var(--color-accent))`, never the var directly (documented in `globals.css` and `ui-design-system.md §1.1`).

*Trade-off:* hex is more readable in the token block; the triplet format is the price of first-class opacity modifiers. A comment in `:root` explains the format so it isn't "fixed" back to hex.

### 2.2 No dark mode

The TODO suggested a theme context for light/dark. `design.md` prescribes a fixed premium-editorial palette (white canvas, near-black ink, single red accent). Introducing a dark variant would (a) contradict the design language and (b) double the token surface for zero user value today. Decision: **single theme**, tokens structured so a future dark palette is a 9-line swap in `:root` if it's ever warranted. Note this in the roadmap if it becomes a request.

### 2.3 Animation approach: CSS + IntersectionObserver, no animation library

`design.md` §40 asks for calm, CSS-based motion. We used Tailwind keyframes + a 25-line `Reveal` client component instead of Framer Motion — smaller bundle, no dependency, and the global reduced-motion block covers everything for free.

*Trade-off:* no spring/timeline choreography. Fine for this aesthetic; revisit only if a richer on-device dashboard lands.

### 2.4 Dropzone: one interactive element, not nested controls

The old dropzone was `role="button"` **containing a real `<button>`** (browse) — an invalid nested-interactive pattern and a doubly-trappable keyboard control. New behavior:

- Whole region is the control (`role="button"`, tabbable, Enter/Space opens the picker).
- Clicking anywhere opens the picker (`noClick` defaults off) — previously the big area wasn't clickable.
- Clipboard paste is handled (`onPaste` → files).
- The hidden `<input>` is `tabIndex={-1}` + `aria-hidden`; the region owns the accessible name.

### 2.5 Scroll-progress hairline without re-renders

Header scroll progress writes `style.width` through a ref inside `requestAnimationFrame`; the component never re-renders on scroll, and the feature is skipped entirely under reduced motion.

*Trade-off:* the bar is informational only (a cosmetic state); the sticky header is already the wayfinding cue.

### 2.6 Skeleton vs. spinner

The catalogue fetch (React Query) previously rendered “0 conversions available” while loading — a false signal. We show a `.skeleton` shimmer shaped like the dropzone (`role="status"`). Loading states are always *indicative of the eventual layout*, per the design language.

### 2.7 Disabled semantics

`Button` adds `disabled:pointer-events-none disabled:opacity-40`; link-based buttons rely on consumers passing `aria-disabled`. The convert CTA uses the text-swap pattern (“Choose a format” → “Convert X”) instead of a toast, keeping the pre-action state visible.

---

## 3. Migration guide

For new UI code:

1. Import primitives from `@/components/ui/*` — never build buttons/inputs/icons by hand.
2. Reference tokens only through utilities (`bg-accent`, `text-muted`, `border`, `shadow-card`); never inline hex or `var()`.
3. Form controls → `Field` + `controlClass`.
4. Status labels → `StatusPill`. Icons → `Icon` (remember it's `aria-hidden` by default; label the control).
5. Section entrances → `Reveal` with staggered `delay` (e.g., 0/60/120ms per sibling).
6. Any new color must be added to `:root` **and** `tailwind.config.ts` in the triplet form.

Existing patterns to convert when touched: raw `<button className="bg-accent …">` → `Button`; inline `<svg>` arrows → `Icon name="arrow-right"`; hand-rolled label+input pairs → `Field`.

---

## 4. Files touched

```
app/globals.css                     tokens, skeleton/shimmer, focus ring
tailwind.config.ts                  colors→vars, shadow-card, spin keyframe
components/ui/Button.tsx            NEW
components/ui/Icon.tsx              NEW
components/ui/Field.tsx             NEW
components/ui/Skeleton.tsx          NEW
components/ui/StatusPill.tsx        NEW
components/ui/Reveal.tsx            NEW
components/Header.tsx               active nav, progress, menu a11y, Button
components/Footer.tsx               duration token cleanup
components/home/Hero.tsx            Button CTAs
components/home/ConversionGrid.tsx  Reveal stagger, hover lift, Icon
components/home/Sections.tsx        Button/Icon/Reveal
components/convert/Dropzone.tsx     single interactive region + paste
components/convert/ConverterWorkspace.tsx  skeleton, steps, alerts, Field, aria-live
components/convert/QueueItemView.tsx       StatusPill, Button, icons
README.md                           structure snippet
documentation/ui-design-system.md   NEW
documentation/ui-implementation-notes.md  this file
```

---

## 5. Verification performed

| Check | Result |
| --- | --- |
| `CI=true pnpm typecheck` | Pass (tsc --noEmit) |
| `CI=true pnpm lint` | “No ESLint warnings or errors” |
| `CI=true pnpm test` | 35/35 (incl. real LibreOffice pipeline) |
| `CI=true pnpm build` | Success; static `/` and `/convert` prerendered |
| CSS audit | Opacity utilities compile to `rgb(var(--color-accent)/.05)` etc.; `:root` tokens present |
| Reduced motion | Global block covers skeleton, reveals, scroll progress |
