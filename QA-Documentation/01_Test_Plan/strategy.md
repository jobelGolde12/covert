# QA Strategy

## 1. Purpose

Independent quality-assurance pass over the **Folio** web application (Next.js 14 document converter) in the project root. This QA run is **test-only**: findings are documented, none of the underlying defects were fixed as part of this effort.

## 2. Scope of the run

| Layer | Technique | Output |
|---|---|---|
| Functional API | Live black-box testing of every `/api/v1/*` route (happy path, negative path, edge cases, concurrency) | `02_Functional_Testing/` |
| End-to-end conversion | Real LibreOffice conversion (markdown → PDF) driven over HTTP and through a real browser | `02_Functional_Testing/` |
| Security | OWASP-oriented source review of route handlers + runtime probing of the live server | `03_Security_Audit/` |
| Dependencies | `pnpm audit` against the installed lockfile | `03_Security_Audit/dependency_scan.md` |
| Performance | Production build metrics, route/bundle sizes, browser Core Web Vitals | `04_Performance_Analysis/` |
| UI / UX | Live-browser accessibility-tree inspection (WCAG 2.1 AA lens) + mobile-viewport behavioral checks | `05_UI_UX_Review/` |
| Summary | Severity-ranked findings and release verdict | `06_Summary/final_verdict.md` |

## 3. QA principles applied

1. **Evidence before assertion** — every finding in this suite is backed by a captured HTTP status, log line, DOM snapshot, or audit output. Test artifacts are explicitly separated from genuine defects.
2. **No source changes** — the codebase was not modified during testing. The only files created by this run live under `QA-Documentation/`.
3. **Secrets handling** — the `.env` file was never read, printed, or exposed. Configuration review was performed against `.env.example` and `lib/env.ts` defaults only.
4. **Negative testing** — invalid input, expired/malformed tokens, traversal attempts, state-machine violations, rate-limit exhaustion, and concurrent access were exercised in addition to happy paths.

## 4. Test design notes

- **Functional suite**: a single script (`/tmp/opencode/functest.sh`) exercised all 10 API route groups in dependency order (formats → upload → put → complete → files → jobs → events → cancel → rate limit → delete). Results were captured per-case to `02_Functional_Testing/execution_results.md`.
- **Concurrency**: 20 simultaneous `POST /files/upload` requests were fired to probe the unique-constraint race suspected in the code (`storageKey: "pending"` placeholder).
- **State machine**: job lifecycle (queued → processing → done/error/cancelled) and the cancel route's guards were probed at different points in the lifecycle, including a cancel issued mid-processing.
- **Identity & throttling**: rate-limit headers were captured and a 61-request burst was used to trigger HTTP 429; a spoofed `X-Forwarded-For` header was then tested against the same limit.
- **Browser pass**: a headless Chromium session (agent-browser, CDP) performed real DOM/accessibility-tree inspection, an on-device (client-side) PNG→PDF conversion, a server-side markdown→PDF conversion over SSE, and mobile-viewport (390×844) menu behavior.

## 5. Severity model

| Severity | Definition |
|---|---|
| **Critical** | Data loss/exposure, unauthenticated code execution, or total service unavailability. |
| **High** | Reproducible failure of a core user flow, or bypass of a primary security control under realistic conditions. |
| **Medium** | Meaningful correctness/security/performance degradation that requires specific conditions. |
| **Low** | Cosmetic, hardening, or edge-case issues with limited impact. |
| **Info** | Observations and design notes; not defects per se. |

## 6. Tooling / commands

```bash
pnpm dev                 # dev server on :3000 (backgrounded via nohup)
pnpm worker:office       # BullMQ worker (concurrency 1, real LibreOffice)
pnpm worker:sweeper      # retention sweeper (15 min interval)
CI=true pnpm test        # Vitest suite — 35/35 passed, 16.36s
CI=true pnpm lint        # eslint-config-next — 0 warnings
CI=true pnpm typecheck   # tsc --noEmit — clean
CI=true pnpm build       # next build — clean
CI=true pnpm audit --json
agent-browser            # browser automation (CDP + accessibility tree)
```

> `CI=true` prefix is required in this environment (bare pnpm aborts non-interactive installs/module touches).
