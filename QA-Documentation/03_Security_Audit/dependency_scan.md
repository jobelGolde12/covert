# Dependency Scan

Run via `CI=true pnpm audit --json` against the installed lockfile on **2026-08-16**.

## Totals

```
37 vulnerabilities:  1 critical | 14 high | 19 moderate | 3 low
92 dependencies audited
```

## Advisories affecting the production runtime (relevant)

| Package | Installed | Severity | Title | Patched |
|---|---|---|---|---|
| `next` | 14.2.28 | HIGH (×7) | RSC Denial of Service; RSC deserialization DoS (2 follow-ups); SSRF via WebSocket upgrades; Middleware/Proxy bypass (i18n); App Router Server Actions DoS; SSRF in rewrites | ≥14.2.34 / ≥14.2.35 / ≥15.5.16 / ≥15.5.21 |
| `next` | 14.2.28 | LOW | Cache poisoning via collisions in RSC cache-busting | ≥15.5.16 |
| `postcss` (transitive, build-time) | ≤8.5.17 | HIGH (×2) | Source-map path traversal / arbitrary `.map` file disclosure | ≥8.5.12 / ≥8.5.18 |

**Applicability note (Next.js):** the SSRF variants require rewrites, a custom server, i18n middleware, or WebSocket upgrades — **none of which this app uses**. The RSC DoS / deserialization advisories (patched ≥14.2.34/35 and ≥15.5.15/16) apply to the App Router Server Components this app does use. **Action:** upgrade `next` to ≥14.2.35 as a stop-gap; plan the 15.5.x major for full coverage.

`postcss` is a build-time transitive of Tailwind — not shipped to the browser, but upgrade to silence the scanner.

## Advisories affecting development tooling only (not in production bundles)

| Package | Severity | Title | Note |
|---|---|---|---|
| `vitest` <3.2.6 | **CRITICAL** | Arbitrary file read + execution when the Vitest UI server is listening | dev-only |
| `glob` >=10.2.0 <10.5.0 | HIGH | CLI command injection via `-c/--cmd` (`shell:true`) | dev-only |
| `vite` <=6.4.2 | HIGH | `server.fs.deny` bypass on Windows alternate paths | dev-only (via vitest) |
| `esbuild` (via vitest) | HIGH | (server.fs / sandbox family) | dev-only |
| `@vitest/*`, `vite-node` chains | MODERATE (×19) | mixed | dev-only |

## Verdict

- **Ship-blocking for production?** The `next` RSC DoS advisories apply to the deployed runtime → upgrade `next` before a public launch (14.2.28 is far below the patched line).
- **Not shipping now.** The critical Vitest finding is dev-only; it is a real risk for anyone running CI on untrusted inputs, but it does not affect the built application.
- **Low noise:** 3 low + 19 moderate are transitive dev-tooling issues with no runtime exposure.
