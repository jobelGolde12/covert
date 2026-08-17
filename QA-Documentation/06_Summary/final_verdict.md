# Final Verdict

QA run date: **2026-08-16** · Scope: see `01_Test_Plan/`. All findings are documented, **none were fixed** (test-only mandate).

## Headline results

| Gate | Result |
|---|---|
| Automated tests (`CI=true pnpm test`) | 35/35 pass (16.36 s, real LibreOffice) |
| Lint / typecheck / build | clean / clean / clean |
| Scripted API suite (73 assertions) | 65 pass · 4 genuine defects · 4 harness artifacts |
| Browser end-to-end (client + server conversions) | pass |
| Core Web Vitals (home) | LCP 340 ms · CLS 0 · TTFB 131.7 ms |
| Dependency audit | 37 advisories (1 critical dev-only, 14 high incl. Next.js) |

## Defects by severity

| ID | Severity | Title |
|---|---|---|
| **BUG-01** | **High** | Concurrent uploads → 500 (`storageKey:"pending"` unique-collision; 14/20 failed live) |
| **SEC-01** | **High** | Rate-limit & daily-quota bypass via client-supplied `X-Forwarded-For` (verified live) |
| BUG-03 | Medium | Cancel in-flight job accepted (200) then worker flips state to `done` (verified live) |
| BUG-04 | Medium | Failed/duplicate job requests consume the daily conversion quota |
| SEC-02 | Medium | Guest-identity cookie computed but never sent → no persistent identity |
| SEC-03 | Medium | Default `UPLOAD_SECRET` fallback if env missing (config risk) |
| SEC-04 | Medium | Next.js 14.2.28 below patched line (RSC DoS etc.) |
| PERF-01 | Medium | `completeUpload` buffers whole object (up to 1 GB) to checksum |
| BUG-02 | Low | Download `Content-Disposition` uses storage UUID, not friendly filename |
| SEC-05/06/07, PERF-02/03, UI nits | Low / Info | CSP missing, `X-Powered-By` leaked, SSE unthrottled, dev-toolchain CVEs, buffered downloads, heading-level skips |

## Verdict

**Not ready for production deployment without addressing BUG-01 and SEC-01.**

- **BUG-01** breaks the core upload flow under any concurrent load (multiple tabs, multiple users, or the multi-file flow racing). It is cheap to fix (create the row with its final storage key) and was reproduced deterministically.
- **SEC-01** neutralizes the two primary anonymous-abuse controls of the whole system. It is only mitigated today by the assumption of a trusted reverse proxy; deployed directly, an attacker gets unlimited conversions and request volume.
- BUG-03 (cancel race) and BUG-04 (quota on failed requests) are correctness issues with user-visible consequences that should be fixed before GA but are not launch-blocking.
- The remaining items are standard hardening: upgrade `next`, add a CSP, stream file reads/checksums, honor `Idempotency-Key` semantics on failure, and set the guest cookie the code already intends to set.

**What is in good shape:** the conversion pipeline works end-to-end with real LibreOffice, the API is consistently validated and well-shaped, storage tokens are correctly HMAC-signed and traversal-safe, anonymous retention is enforced by a working sweeper, accessibility work is above-average (skip link, live regions, keyboard dropzone, reduced-motion support), and the frontend is lean and fast (96.5 kB home / 144 kB convert first-load, CLS 0).

**Recommended order of work:** 1) BUG-01 upload race → 2) SEC-01 + SEC-02 identity/throttling → 3) BUG-03 cancel race → 4) BUG-04 quota accounting → 5) Next.js upgrade + CSP → 6) PERF-01/03 streaming → 7) polish (Content-Disposition, heading order, SSE throttle).
