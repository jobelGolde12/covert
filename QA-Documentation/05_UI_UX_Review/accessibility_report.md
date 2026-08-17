# Accessibility Report

Reviewed through a live browser accessibility tree (agent-browser/Chromium) plus source inspection of the interactive components. **WCAG 2.1 AA lens.** The reviewing model cannot perceive screenshots, so contrast was assessed via the token system + source values, not pixel measurement; every other check is a DOM/behavioral observation.

## Verified pass items

| Requirement | Evidence |
|---|---|
| Skip link (2.4.1) | `Skip to content` is the first focusable element, `href="#main"`, appears on focus. `app/layout.tsx:28-33` |
| Language (3.1.1) | `<html lang="en">`. `app/layout.tsx:26` |
| Page title (2.4.2) | `title` template `%s · Convert`, default set in `app/layout.tsx:14-18` |
| Heading structure (1.3.1) | Single `h1` per page; content sections use `h2`/`h3`/`h4` consistently |
| Landmarks (1.3.1) | `main`, `nav` (`Primary`), `navigation` for footer columns, `region` for content sections |
| Navigation labeling (2.4.6) | Header nav labeled "Primary"; footer link groups have headings (CONVERT / COMPANY / SUPPORT) |
| Descriptive link names (2.4.4) | Conversion cards expose names like "Word to PDF — open converter"; download links include the output filename |
| Keyboard operability (2.1.1) | Dropzone is a single `role="button"` with `tabIndex=0` handling Enter/Space (`components/convert/Dropzone.tsx:44-53`); all controls are native buttons/links/inputs/selects |
| No keyboard traps (2.1.2) | Tab order flows header → main → footer; mobile menu closes on `Escape` (verified live) |
| Focus visible (2.4.7) | Global `:focus-visible` outline (2 px accent + 2 px offset), `app/globals.css:52-56` |
| ARIA state on selected format | Format cards are `button` + `aria-pressed` (`ConverterWorkspace.tsx:352`) |
| Current step announced | Step indicator `ol aria-label="Conversion steps"` with `aria-current="step"` (`ConverterWorkspace.tsx:259-291`) |
| Live announcements (4.1.3) | `role="status" aria-live="polite"` region announces "… conversion finished/failed" (verified rendered in DOM); queue updates during SSE |
| Busy state (4.1.2) | `aria-busy` on the workspace during conversion |
| Error feedback (4.1.3) | Error banners use `role="alert"`; input errors via `aria-invalid`-style messaging where applicable |
| Labeled controls (1.3.1, 4.1.2) | `Field` renders `<label>` bound via `htmlFor`; dropzone has an explicit accessible name; remove-buttons have `aria-label="Remove <file>"` |
| Non-text content (1.1.1) | Icons are `aria-hidden` with text labels alongside; hero images decorative |
| Motion (2.3.3) | Full `prefers-reduced-motion` neutralization block + `Reveal` component respects it (verified in `app/globals.css:102-111`, `components/ui/Reveal.tsx:24`) |
| Menu disclosure (4.1.2) | `Open menu` button toggles `aria-expanded` true/false and its label flips to `Close menu` (verified live) |

## Minor issues

| Issue | Severity | Detail |
|---|---|---|
| Heading-level skips on the homepage | Low | Homepage regions jump `h1` (hero) → `h3` in the Privacy claims and footer columns without an intervening `h2`. Footer link-group headings (`CONVERT` etc.) are `h3`s that follow the main `h1`. Not AA-failing, but breaks strict outline expectations for screen-reader navigation. |
| Multiple landmarks share no distinguishing labels in footer | Low | Footer link groups are `navigation` landmarks; their headings provide names, but the landmarks themselves are unnamed (`navigation "Convert"`, `navigation "Company"`… auto-derived from content in Chrome — acceptable). |
| Contrast pending pixel verification | Info | Color tokens define a dark-on-light foreground/muted pairing (`globals.css`/`tailwind.config.ts`). Values look within AA, but this report did not instrument pixel contrast (model cannot view screenshots). |
| `aria-live` region always mounted | Info | The live region is always in the DOM with an empty string; harmless, but the text content changes only on terminal states. |

## Strengths worth preserving

- The whole interactive region is one control (no nested focusable elements inside the dropzone).
- All stateful UI (menu, format selection, steps) is wired through proper ARIA attributes rather than purely visual styling.
- Reduced-motion and focus-visible are handled globally, not per-component.
