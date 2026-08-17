# Build Analysis

Production build run with `CI=true pnpm build` on **2026-08-16** (Next.js 14.2.28).

## Result

```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages (6/6)
✓ Finalizing page optimization
```

No warnings, no errors. The pdfjs worker is copied via `prebuild`/`postinstall`.

## Route & bundle sizes

| Route | Type | Route size | First Load JS |
|---|---|---|---|
| `/` | static | 621 B | 96.5 kB |
| `/convert` | static | 42.9 kB | 144 kB |
| `/api/*` (10 routes) | dynamic | 0 B | 0 B |
| `/_not-found` | static | 870 B | 88 kB |
| Shared runtime (all pages) | — | — | 87.2 kB |

Key shared chunks: `chunks/550-*` 31.6 kB, `chunks/751ca6e4-*` 53.6 kB.

## Analysis

- **Homepage is lean** — 96.5 kB first load, fully static/prerendered.
- **`/convert` is heavier (144 kB)** — it loads the client conversion engine surface (pdf-lib / pdfjs) statically. The heavier client PDF-tool libraries are shipped upfront even though only one tool is used at a time; a dynamic import per conversion tool would cut the initial JS for users who only run server conversions.
- **API routes contribute 0 B to client bundles** — correctly server-only.
- **Six static pages** — pages are prerendered; `@tanstack/react-query` runs client-side only.

## Measured browser Core Web Vitals (home, `/`)

| Metric | Value |
|---|---|
| TTFB | 131.7 ms |
| LCP | 340 ms (hero SVG) |
| FCP | 340 ms |
| CLS | **0** |

Excellent for a server-rendered Next app; no layout shift, fast first paint.

## Build-time risks / notes

- Running `next build` while `next dev` is live replaces `.next` and breaks the running dev server's chunk URLs (404s on `main-app.js`, `app/page.js`, etc.) until it is restarted. CI/containers are unaffected; this is a local-workflow hazard only (documented in `01_Test_Plan/environment_setup.md`).
- The custom webpack aliases (`canvas` → stub, `@valkey/valkey-glide` → false) are intentional and work; they exist to keep pdfjs/bullmq out of the browser bundle.
