# Folio — UI Design System

> **Design reference:** This document codifies the implementation of the visual language in [`design.md`](../design.md) — premium editorial, restrained black/white/red palette, Inter typography, sharp architectural shapes, generous whitespace. Everything here maps back to a numbered `design.md` section where relevant.

---

## 1. Design tokens

Tokens are defined **once** as CSS custom properties in `app/globals.css` (`:root`) and referenced by `tailwind.config.ts`. They are RGB **channel triplets** (not hex) so Tailwind's opacity modifier compiles to `rgb(var(--color-*) / <alpha>)`.

### 1.1 Color (design.md §3, §28)

| Token | RGB | Role |
| --- | --- | --- |
| `--color-background` | `255 255 255` | Page canvas |
| `--color-surface` | `248 248 246` | Alt section fill |
| `--color-foreground` | `23 23 23` | Primary text |
| `--color-muted` | `119 119 119` | Secondary text (4.6:1 on white) |
| `--color-light` | `160 160 160` | Eyebrows, index numbers, metadata (design.md §3 `text-light`) |
| `--color-border` | `232 232 232` | Hairlines, dividers |
| `--color-accent` | `200 16 46` | The single red accent (never a fill) |
| `--color-accent-hover` | `159 13 36` | Accent press/hover state |
| `--color-dark` | `17 17 17` | Footer / primary CTA fill |
| `--color-white` | `255 255 255` | Inverted text on dark |

Usage in markup:

```tsx
<div className="bg-accent/10 text-accent">…</div>   // tinted surfaces
<div className="text-muted">…</div>                // secondary text
```

> **Rule — the red accent is a detail, not a fill.** Primary CTAs are dark `#111111` (design.md §36). The accent is reserved for micro-labels (“On your device”), tiny indicators, focus states, the hero artwork's door, and the one handwritten annotation. Never paint large areas with it. (See do's & don'ts §4.)

### 1.2 Typography (design.md §4)

Fixed editorial scale in `tailwind.config.ts` → `fontSize`. Use the tokens, not arbitrary sizes.

| Utility | Size / line | Use |
| --- | --- | --- |
| `text-nav` | 12 / 1.4 | Nav, footer headings, labels |
| `text-btn` | 12 / 1.4 · 600 | Button labels |
| `text-body-sm` | 15 / 1.6 | Supporting copy, metadata |
| `text-body` | 17 / 1.6 | Body copy |
| `text-lead` | 19 / 1.55 | Hero subline |
| `text-h3` | 22 / 1.2 | Card titles, section subtitles |
| `text-h2` | 32 / 1.08 | Section headings |
| `text-h1` | 48 / 1.02 | Page title |
| `text-display` | 64 / 1.0 | Large section statements |
| `text-hero` | `clamp(42px, 7vw, 92px)` / 0.98 · −0.05em · 400 | Oversized thin editorial headline (design.md §4) |

Type is set in **Inter** (`--font-sans`); headings stay within ±0.5 weight of body for the quiet editorial voice.

### 1.3 Spacing, radius, elevation (design.md §31)

- **Spacing:** standard Tailwind scale (so fractional steps like `mt-1.5` and control heights `h-9`/`h-11` always compile) plus `30` (120px) for editorial section rhythm. Grid padding: `px-5 md:px-10 lg:px-16`, section rhythm `py-20 md:py-30`.
- **Radius:** sharp architecture — `rounded-none` (0) or `rounded-xs` (2px). Never pill buttons/cards. Focus ring radius is 2px.
- **Elevation:** `shadow-menu` (0 8px 30px, 6% black) for menus/overlays only. Everything else is flat + hairline (`border`); the conversion directory uses numbered rows with hairline dividers, not lift cards.

### 1.4 Motion (design.md §27, §40)

- **Duration:** `duration-fast` 150ms, default 200ms, `duration-slow` 500ms. Easing default; `ease-out` for reveals.
- **Allowed:** fade, fade-up, translate, rotate-45 (FAQ plus), shimmer. **Disallowed:** bounce, elastic, scale-pulse, marquee.
- Every animation is neutralized by the global `prefers-reduced-motion` block in `globals.css`.
- Scroll progress is driven via rAF + direct DOM mutation (no per-frame React re-render) and is disabled under reduced motion.

---

## 2. Component inventory

All primitives live in `components/ui/`. **Prefer these over hand-rolled markup.**

### 2.1 `Button` — `components/ui/Button.tsx`

Single primitive; renders `<button>` or `<Link>` depending on whether `href` is passed. `md`/`lg` are 44–48px tall, satisfying touch targets (design.md §36: primary CTA is a compact **dark** button; the accent is never a fill).

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `primary \| outline \| ghost \| link` | `primary` | `primary` = dark `#111111`; `link` is a bare editorial text link (h-auto) |
| `size` | `sm \| md \| lg` | `md` | `sm` = h-9 (36px), `md` = h-11 (44px), `lg` = h-12 (48px); ignored for `link` |
| `fullWidth` | `boolean` | `false` | |
| `icon` / `iconRight` | `IconName` | — | leading/trailing icon |
| any button / anchor attr | — | — | `disabled`, `onClick`, `download`, `aria-label`, … |

```tsx
<Button href="/convert">Start converting</Button>
<Button variant="primary" size="sm" icon="download">Export</Button>
<Button variant="ghost" size="sm" onClick={remove} aria-label="Remove">…</Button>
```

### 2.2 `Icon` — `components/ui/Icon.tsx`

24px grid, 1.5px stroke, `currentColor`. **Every icon is `aria-hidden` by default** — pair with text or an `aria-label` on the control. Icon list: `arrow-right`, `arrow-left`, `close`, `download`, `spinner` (animated), `check`, `file`, `plus`, `chevron-down`, `menu`, `device`, `shield`, `alert`, `refresh`, `lock`, `upload`.

### 2.3 `Field` — `components/ui/Field.tsx`

Labelled control wrapper + exported `controlClass` (input/select chrome: hairline, 40px, accent focus ring). Use for every option input on the converter.

```tsx
<Field label="Angle" htmlFor="opt-angle" hint="…">
  <select id="opt-angle" className={controlClass}>…</select>
</Field>
```

### 2.4 `Skeleton` — `components/ui/Skeleton.tsx`

Shimmer placeholder (`role="status"` + accessible label). Static under reduced motion. Used for the catalogue loading state.

### 2.5 `StatusPill` — `components/ui/StatusPill.tsx`

Uppercase status tag. Tones: `neutral`, `accent`, `success`, `error`, `active`. Used on queue items and the “On your device” badge.

### 2.6 `Reveal` — `components/ui/Reveal.tsx`

Client-side reveal-on-scroll (IntersectionObserver). Instantly visible under reduced motion or without IO. Used for staggered section grids (`delay` prop).

---

## 3. Accessibility checklist

Implemented and enforced on this codebase:

- **Contrast:** `muted` (107 107 107) on white ≈ 4.6:1; all interactive text uses `foreground`/`accent` with sufficient weight.
- **Focus:** global `:focus-visible` (2px accent outline); inputs show accent ring. Skip link in `app/layout.tsx`.
- **Touch targets:** buttons ≥ 44px (`md`/`lg`); icon-only buttons are `h-11 w-11` (44px).
- **Semantics:** `role="button"` dropzone with no nested interactive elements; `aria-pressed` format tiles; `aria-current="page"` active nav; `role="alert"` error banners; `role="status"`/`aria-live="polite"` for queue completion announcements; `role="progressbar"` with `aria-valuenow` on queue items; `aria-busy` during conversion.
- **Keyboard:** Enter/Space opens the dropzone; Escape closes the mobile menu; focus returns to the toggle on close; body scroll is locked while the menu is open.
- **Reduced motion:** global CSS block; `Reveal`, scroll-progress, shimmer all respect it.
- **Icons:** always `aria-hidden`; never the sole affordance without an accessible name.

---

## 4. Do's & don'ts

| ✅ Do | ❌ Don't |
| --- | --- |
| Use `Button`, `Icon`, `Field`, `Skeleton`, `StatusPill` primitives | Roll your own `<button className="bg-accent …">` |
| Use tokens (`bg-accent`, `text-muted`) | Hardcode hex or `var(--color-…)` inline |
| Keep the red accent for one primary action / live / selected / error | Paint large areas red, or red everywhere |
| Use `rounded-none` / `rounded-xs` | Rounded/pill cards and buttons |
| Respect the 4px spacing scale | Fractions or magic offsets (use arbitrary values only for ephemeral layout, e.g. `h-[3px]`) |
| Test with reduced-motion on | Ship motion that ignores `prefers-reduced-motion` |
| Label every control (`Field`) and icon button (`aria-label`) | Leave inputs without labels or icons without names |
