# Redesign the Current Next.js Project — Modern Editorial Website

You are an expert **Next.js frontend engineer, UI/UX designer, and creative web designer**.

Your task is to **redesign the existing Next.js project**, not create a completely unrelated website from scratch.

The primary design reference is the project's `design.md` file. **Read and follow `design.md` carefully before modifying the project.** The supplied screenshot that inspired `design.md` is a visual reference only. Do not copy its content, branding, wording, images, or specific subject matter.

The goal is to transform the current website into a **modern, minimalist, editorial, premium, visually impressive website** while preserving the existing project's actual content, functionality, routes, business logic, and important features.

---

# 1. FIRST: ANALYZE THE EXISTING PROJECT

Before writing or changing code, inspect the entire existing project.

Analyze:

* `package.json`
* Next.js version
* App Router or Pages Router
* Existing routes
* Existing components
* Existing layouts
* Existing pages
* Existing API integrations
* Existing data structures
* Existing images/assets
* Existing fonts
* Existing Tailwind configuration
* Existing CSS
* Existing design tokens
* Existing reusable components
* Existing forms
* Existing navigation
* Existing functionality
* Existing responsive behavior

Do not immediately replace the project.

First understand how it is currently structured.

### Important

**Do not destroy existing functionality simply to achieve the new design.**

The redesign should primarily change:

* visual hierarchy
* layout
* typography
* spacing
* component styling
* navigation appearance
* imagery
* iconography
* responsive composition
* animations
* interaction design

Existing functionality should remain operational unless there is a clear reason to improve it.

---

# 2. READ `design.md` AS THE PRIMARY DESIGN SPECIFICATION

The `design.md` file is the authoritative design specification for this redesign.

Follow its principles regarding:

* visual direction
* typography
* color
* spacing
* header
* hero
* imagery
* editorial layouts
* buttons
* links
* responsive design
* animations
* accessibility
* performance
* component architecture

The design specification specifically calls for a visual language based on:

**large thin typography + compact navigation + expansive white space + one dominant visual + restrained color + editorial composition.**

Do not reinterpret this as a generic corporate landing page.

---

# 3. IMPORTANT: DO NOT COPY THE REFERENCE SCREENSHOT

The screenshot is inspiration for **visual style only**.

Do NOT copy:

* screenshot text
* screenshot brand name
* screenshot logo
* screenshot object
* screenshot social links
* screenshot images
* screenshot wording
* screenshot-specific content
* screenshot-specific business context

Instead, use the **existing project's actual content**.

For example:

If the current project is about a product, service, company, portfolio, application, organization, or business, preserve that subject.

Only redesign how that content is presented.

---

# 4. OVERALL VISUAL GOAL

The final website should look like a professionally designed modern website created by an experienced digital design studio.

It should feel:

* Minimal
* Premium
* Editorial
* Creative
* Modern
* Clean
* Spacious
* Sophisticated
* Confident
* Human
* Art-directed
* Responsive
* High-end

Avoid making it look like:

* a generic SaaS template
* a Bootstrap template
* a typical WordPress website
* an old corporate website
* a dashboard
* a card-heavy UI
* a generic AI-generated landing page
* a template with excessive rounded corners

---

# 5. DESIGN THE WEBSITE AROUND COMPOSITION

Do not build the page by simply stacking cards vertically.

Think like an art director.

Use:

* large typography
* asymmetric layouts
* carefully controlled whitespace
* strong visual hierarchy
* intentional image placement
* varying section heights
* large visual objects
* editorial compositions
* subtle details
* restrained UI

Every section should have a reason to exist.

Avoid filling empty space just because space is available.

---

# 6. HEADER / NAVIGATION

Redesign the header to be extremely clean and compact.

The header should visually resemble a premium editorial website.

Recommended structure:

```text
LOGO                         NAVIGATION                    ICONS
```

For example:

```text
Brand             About   Work   Expertise   Contact      ◯  ◯  ◯
```

Use the project's actual navigation labels.

### Header requirements

* White background
* Minimal height
* Small logo
* Small navigation typography
* Large horizontal whitespace
* Minimal borders
* No giant CTA
* No unnecessary shadows
* No oversized navigation elements

Recommended:

```text
Desktop height: 52–68px
```

The header should never compete with the hero.

---

# 7. MODERN ICON SYSTEM

Use a modern, consistent icon library.

### Preferred

Use **Lucide React** if it is already installed.

If Lucide is not installed and the project allows adding dependencies, install/use:

```bash
npm install lucide-react
```

Use Lucide icons consistently throughout the website.

Examples:

* Menu
* ArrowRight
* ArrowUpRight
* ChevronDown
* Instagram
* Linkedin
* Github
* Mail
* Phone
* MapPin
* ExternalLink
* Search
* X
* Plus
* Minus

Use icons only where they improve usability.

### Icon design rules

Icons should be:

* thin
* clean
* modern
* consistent
* minimal
* approximately 14–18px for normal UI
* approximately 18–22px for larger controls

Do not mix several unrelated icon styles.

Do not use:

* emoji as UI icons
* random Unicode symbols
* inconsistent icon packs
* oversized decorative icons
* thick cartoon icons
* unnecessary icon containers

Avoid putting every icon inside a circular background.

The icon itself should usually be enough.

---

# 8. HERO SECTION

The hero should be the strongest visual part of the website.

Use this general composition:

```text
--------------------------------------------------

             SMALL EYEBROW

        Large editorial
        headline that
        communicates the
        actual value proposition

                                      LARGE
                                      VISUAL
                                      OBJECT
                                      / IMAGE


--------------------------------------------------
```

The hero should NOT be a traditional centered SaaS hero.

### Left side

Place:

1. Small eyebrow
2. Large headline
3. Optional short description
4. Minimal CTA/link

### Right side

Place:

* one dominant image
* product visual
* architectural image
* cut-out object
* 3D render
* relevant photography
* existing project visual

Choose the visual that best represents the actual website.

---

# 9. HERO TYPOGRAPHY

The hero headline must be large and elegant.

Use approximately:

```css
font-size: clamp(52px, 6vw, 100px);
font-weight: 400;
line-height: 0.96;
letter-spacing: -0.05em;
```

Adjust based on the actual font and screen size.

Do not automatically use bold typography.

The heading should feel:

**large, light, confident, editorial.**

Use deliberate line breaks when they improve the composition.

Do not allow awkward wrapping.

---

# 10. HERO EYEBROW

Use a tiny label above the main heading.

Example:

```text
DIGITAL EXPERIENCE
```

But use the project's actual context.

Style:

```text
8–11px
medium weight
slightly increased letter spacing
muted gray
```

The eyebrow is metadata, not a heading.

---

# 11. HERO CTA

Do not place three or four giant buttons under the hero.

Use one primary action when appropriate.

Prefer:

```text
Explore →
```

or:

```text
Learn More →
```

or the project's actual primary action.

Use a compact dark button only when a true button is necessary.

Otherwise use an editorial text link with:

```text
ArrowRight
```

The arrow should subtly move on hover.

Example behavior:

```text
Explore →
       → moves 4px right
```

---

# 12. HERO VISUAL

Do not automatically place the image inside a rounded card.

The visual should feel like an **art-directed object placed directly onto the white page**.

Use:

```text
object-fit: contain;
```

for isolated objects.

Use:

```text
object-fit: cover;
```

for editorial photography.

The visual can slightly extend outside its grid.

It should feel deliberately positioned rather than perfectly centered.

---

# 13. WHITE SPACE

Whitespace is one of the most important design elements.

Use substantial space between:

* header and hero
* eyebrow and headline
* headline and supporting text
* sections
* images and captions
* content groups

Do not compress everything.

The website should feel calm and premium.

---

# 14. SECTION DESIGN

Do not make every section look identical.

Create visual rhythm.

Alternate layouts such as:

### Layout A

```text
Large text                 Large image
```

### Layout B

```text
Large image                Large text
```

### Layout C

```text
          Large centered visual

       Small caption
       Large heading
```

### Layout D

```text
Small label

Very large statement

                         Supporting content →
```

Use these layouts where appropriate based on the existing content.

---

# 15. AVOID CARD-HEAVY DESIGN

This is extremely important.

Do not automatically convert every item into:

```text
┌───────────────┐
│ Icon          │
│ Title         │
│ Description   │
│ Button        │
└───────────────┘
```

Instead, use editorial layouts.

For example:

```text
01  Service Name                    →
    Short description
```

or:

```text
Large image

Service Name →
```

Use cards only where they genuinely improve usability.

---

# 16. IMAGES

Use the project's existing image assets whenever appropriate.

Before replacing images, inspect:

* `/public`
* `/public/images`
* `/assets`
* imported image files
* existing media components

Use the best existing assets.

If the current project has poor or placeholder imagery, structure the components so high-quality images can easily be inserted later.

### Image rules

* High quality
* Correct aspect ratio
* No unnecessary filters
* No heavy overlays
* No excessive border radius
* No generic image grids everywhere
* Strong cropping
* Intentional positioning

---

# 17. IMAGE HOVER EFFECTS

Keep image animations subtle.

Default:

```text
scale(1)
```

Hover:

```text
scale(1.025)
```

Duration:

```text
400–500ms
```

Use:

```css
transition: transform 500ms ease;
```

Do not make images aggressively zoom.

---

# 18. MODERN MICRO-INTERACTIONS

Add small interactions that make the site feel polished.

Examples:

### Navigation

```text
opacity change
thin underline
```

### Links

```text
arrow moves 3–5px
```

### Images

```text
scale 1.00 → 1.025
```

### Section reveal

```text
opacity: 0 → 1
translateY(12px) → 0
```

### Buttons

Subtle background/foreground transition.

Avoid:

* bounce
* excessive parallax
* spinning elements
* flashy transitions
* animation on every element

The site should feel **designed**, not animated for the sake of animation.

---

# 19. SCROLL REVEAL

Implement subtle scroll-based reveals where appropriate.

Recommended:

```text
opacity: 0
transform: translateY(12px)

↓

opacity: 1
transform: translateY(0)
```

Duration:

```text
400–700ms
```

Respect:

```css
prefers-reduced-motion
```

Users who disable motion should receive an immediate/static experience.

---

# 20. COLOR

Follow the design system in `design.md`.

Primary:

```text
White
Black
Gray
```

Optional accent:

```text
#D96C92
```

The accent should be used sparingly.

Do not turn the website pink.

Do not create large colorful gradients.

The page should remain predominantly monochrome.

---

# 21. BORDERS

Use very subtle borders.

Preferred:

```css
border-color: #E8E8E8;
```

Use borders for:

* separators
* inputs
* navigation boundaries
* subtle section divisions

Avoid thick decorative borders.

---

# 22. BORDER RADIUS

Keep the geometry architectural.

Use approximately:

```text
0px–4px
```

Avoid:

```text
rounded-2xl
rounded-3xl
rounded-full
```

as the default design language.

Pills should only be used when semantically appropriate.

---

# 23. SHADOWS

Keep the website mostly flat.

Default:

```css
box-shadow: none;
```

Only use shadows for:

* dropdowns
* modal dialogs
* floating mobile navigation
* elevated controls

Keep them extremely subtle.

---

# 24. RESPONSIVE DESIGN

Do not simply shrink the desktop design.

Create a proper mobile composition.

## Desktop

```text
Header
↓
Large two-column hero
↓
Editorial sections
```

## Mobile

```text
Header
↓
Eyebrow
↓
Large heading
↓
Description
↓
CTA
↓
Hero visual
↓
Content
```

On mobile:

* Keep typography large
* Maintain whitespace
* Keep navigation simple
* Move visual below the headline
* Avoid horizontal overflow
* Keep buttons touch-friendly
* Preserve visual hierarchy

---

# 25. MOBILE HEADER

Use:

```text
LOGO                                      MENU
```

The menu icon should use Lucide:

```tsx
<Menu />
```

When opened:

```tsx
<X />
```

The mobile menu should use a clean full-width or full-screen editorial layout.

Do not make it look like a standard Bootstrap menu.

---

# 26. ACCESSIBILITY

Maintain strong accessibility.

Implement:

* semantic HTML
* proper heading hierarchy
* keyboard navigation
* visible focus states
* descriptive alt text
* accessible buttons
* accessible links
* sufficient contrast
* reduced-motion support
* accessible mobile navigation

Do not sacrifice accessibility for visual design.

---

# 27. NEXT.JS BEST PRACTICES

Use the architecture already present in the project.

Prefer:

* Server Components where appropriate
* Client Components only when interactivity requires them
* `next/image`
* optimized fonts
* reusable components
* semantic HTML
* proper metadata
* responsive images

Do not turn the entire application into a client component unnecessarily.

---

# 28. COMPONENT REFACTORING

If the existing project has messy components, refactor them where beneficial.

Create reusable components such as:

```text
Header
Navigation
MobileMenu
Hero
HeroVisual
SectionHeading
EditorialSection
EditorialLink
ImageBlock
Gallery
ProductSection
StorySection
CTASection
Footer
```

Do not create hundreds of tiny components with no purpose.

Componentization should improve maintainability.

---

# 29. ICON IMPLEMENTATION

Use Lucide icons consistently.

Examples:

```tsx
import {
  ArrowRight,
  ArrowUpRight,
  Menu,
  X,
  ChevronDown,
  Instagram,
  Linkedin,
  Github,
  Mail
} from "lucide-react";
```

Use icons with accessible labels where required.

Example:

```tsx
<button aria-label="Open menu">
  <Menu size={18} strokeWidth={1.5} />
</button>
```

Do not use arbitrary SVG icons unless the project already contains a custom brand icon that must be preserved.

---

# 30. MODERN WEBSITE DETAILS

Pay attention to details that make the website feel professionally designed.

Implement:

* optical spacing
* proper line lengths
* intentional line breaks
* subtle hover states
* consistent icon stroke widths
* consistent spacing
* carefully selected image crops
* responsive typography
* clean focus states
* smooth but restrained transitions
* proper whitespace
* subtle metadata labels
* consistent arrows
* carefully aligned elements

Do not rely only on colors and shadows to make the design look modern.

---

# 31. DO NOT OVER-DESIGN

The website should look sophisticated because of:

**typography + composition + whitespace + imagery + interaction quality**

not because of:

* gradients
* glowing effects
* glassmorphism
* excessive blur
* huge shadows
* floating cards
* excessive animations
* dozens of icons
* colorful backgrounds

Avoid trendy effects unless they genuinely support the visual direction.

---

# 32. CONTENT PRESERVATION

Use the existing website's content.

Do not rewrite important business/product information just to make the design look better.

If content needs to be shortened for visual reasons:

* preserve its meaning
* preserve important information
* do not invent claims
* do not invent statistics
* do not invent testimonials
* do not invent company history

If the existing content is already good, keep it.

---

# 33. FUNCTIONALITY PRESERVATION

After redesigning, verify that existing functionality still works.

Check:

* navigation
* links
* forms
* API requests
* authentication
* search
* filtering
* CRUD functionality
* database interactions
* dynamic routes
* mobile navigation
* modals
* buttons
* external links
* image loading

Do not sacrifice functionality for appearance.

---

# 34. PERFORMANCE

The redesigned website should remain fast.

Optimize:

* images
* fonts
* animations
* JavaScript
* component rendering
* unnecessary dependencies

Use:

```tsx
next/image
```

for images whenever appropriate.

Lazy-load images below the fold.

Prioritize the primary hero image.

Avoid importing a large animation library if CSS can accomplish the same effect.

---

# 35. SEO

Do not damage existing SEO.

Preserve or improve:

* page titles
* metadata
* descriptions
* semantic headings
* image alt text
* canonical URLs
* Open Graph metadata
* structured content where already present

Do not randomly change routes.

---

# 36. QUALITY CONTROL

After implementing the redesign, inspect the website at:

```text
1440px+
1280px
1024px
768px
390px
375px
```

Check for:

* horizontal overflow
* broken layouts
* awkward text wrapping
* images extending incorrectly
* navigation collisions
* inaccessible buttons
* inconsistent spacing
* excessive whitespace
* insufficient whitespace
* poor mobile composition
* icon inconsistencies

---

# 37. VISUAL QA

Compare the implementation against the principles in `design.md`.

Ask:

### Does the website feel minimalist?

If not, remove unnecessary UI.

### Does the hero have a strong visual hierarchy?

If not, increase typography scale or simplify competing elements.

### Does the navigation feel compact?

If not, reduce its visual weight.

### Does the page have enough white space?

If not, increase spacing.

### Are there too many cards?

If yes, convert appropriate sections into editorial layouts.

### Are icons modern and consistent?

If not, standardize them using Lucide.

### Does the site feel like a modern creative website?

If not, simplify the interface and improve composition.

---

# 38. FINAL IMPLEMENTATION RULE

Do not merely "apply some CSS" to the existing website.

Actually **redesign the visual system**.

The result should feel like a completely refreshed, professionally art-directed version of the existing website while maintaining its original purpose and functionality.

Think:

```text
Existing functionality
        +
Existing content
        +
design.md visual system
        +
Modern typography
        +
Modern Lucide icons
        +
Editorial composition
        +
Responsive UX
        +
Subtle interactions
        =
Professional modern website
```

---

# 39. FINAL ACCEPTANCE CRITERIA

The redesign is successful only if:

* [ ] The current Next.js project remains functional
* [ ] Existing content is preserved
* [ ] Existing routes continue working
* [ ] Existing important functionality continues working
* [ ] `design.md` is clearly reflected throughout the website
* [ ] The header is compact and modern
* [ ] Navigation typography is small and refined
* [ ] Hero typography is large, thin, and editorial
* [ ] Hero content is left aligned
* [ ] Hero contains one dominant visual
* [ ] White space is intentionally generous
* [ ] The website avoids excessive cards
* [ ] The website avoids excessive rounded corners
* [ ] The website avoids unnecessary gradients
* [ ] The website avoids excessive shadows
* [ ] Lucide icons are used consistently
* [ ] Icons have consistent sizing and stroke weight
* [ ] Interactions are subtle and modern
* [ ] Mobile layout is intentionally redesigned
* [ ] No horizontal overflow exists
* [ ] Accessibility is maintained
* [ ] Images are optimized
* [ ] Existing SEO is not damaged
* [ ] The final result looks like a modern professionally designed website rather than an AI-generated template

---

# 40. MOST IMPORTANT INSTRUCTION

**Use `design.md` as the source of truth for the visual redesign.**

Do not copy the screenshot.

Do not copy its content.

Do not copy its branding.

Do not blindly preserve the current visual design.

Instead, preserve the **current website's purpose, content, routes, and functionality** while transforming its interface into a **minimalist, editorial, premium, modern website** characterized by:

> **Compact navigation + oversized thin typography + generous white space + one dominant visual + restrained monochrome palette + modern Lucide icons + subtle micro-interactions + strong responsive composition.**

Before finishing, review every major page and component against `design.md` and make any additional visual adjustments necessary for the entire project to feel like **one coherent modern design system**, rather than a collection of individually redesigned components.
