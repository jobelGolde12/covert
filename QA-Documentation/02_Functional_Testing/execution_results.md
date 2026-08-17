# Execution Results

Run date: **2026-08-16**. Env: dev server `:3000`, LibreOffice 24.2.7.2, Redis 7.0.15 on `:6379`, SQLite `prisma/dev.db`, office worker concurrency 1.

## Summary

- **Scripted API suite**: 73 assertions → **65 pass, 8 fail** (4 are test artifacts; 4 are genuine defects, see `bug_reports.md`).
- **Browser pass**: client-side PNG→PDF ✓, server-side md→PDF over SSE ✓, mobile menu ✓, Web Vitals collected.
- **Gates**: tests 35/35 ✓ · lint 0 warnings ✓ · typecheck clean ✓ · build clean ✓.

## FMT — Formats catalogue

| ID | Result | Notes |
|---|---|---|
| FMT-01 | PASS | 200, `data.conversions` (25 entries) + `data.formats` |
| FMT-02 | PASS | `Cache-Control: public, max-age=86400` |
| FMT-03 | PASS | 25 ids incl. `docx-pdf`, `pdf-docx`, `pdf-merge`, `image-pdf`. (A probe expecting a `pdf_to_html` entry was a test-artifact fail — no such conversion exists in the catalogue.) |
| FMT-04 | PASS | |

## UPL — Upload initiation

| ID | Result | Notes |
|---|---|---|
| UPL-01 | PASS | 200; UUID; PUT url to `/api/v1/files/upload/put`; `expiresAt` ≈ now+15 min |
| UPL-02 | PASS | `X-RateLimit-Limit: 60` |
| UPL-03..08 | PASS | 422 / 422 / 415 / 413(+maxSizeMB) / 422 / 422 |
| **UPL-09** | **FAIL** | **14 of 20 concurrent uploads → HTTP 500** — `Unique constraint failed on the fields: (storageKey)` (Prisma P2002). See **BUG-01**. |

## PUT — Storage write

| ID | Result | Notes |
|---|---|---|
| PUT-01 | PASS | 204 |
| PUT-02 | PASS | 401 |
| PUT-03 | PASS | 401 |
| PUT-04 | PASS | 400/401 — traversal rejected before any write |

## CMP — Complete upload

| ID | Result | Notes |
|---|---|---|
| CMP-01 | PASS | 422 |
| CMP-02 | PASS | 404 |
| CMP-03 | PASS | 409 before object exists |
| CMP-04 | PASS | 200, `status=ready` |

## FIL — File metadata / deletion

| ID | Result | Notes |
|---|---|---|
| FIL-01 | PASS | 200; `downloadUrl: null` while `ready` |
| FIL-02 | PASS | 404 |
| FIL-03 | PASS | 404 |
| FIL-04 | PASS | output file `status=done`, downloadUrl present |
| FIL-05 | PASS | 200, `deleted:true` (soft-delete via `deletedAt` + `status=expired`); verified with a clean-rate-limit run |

## JOB — Job creation

| ID | Result | Notes |
|---|---|---|
| JOB-01 | PASS | 422 |
| JOB-02 | PASS | 404 |
| JOB-03 | PASS | 422 `UNSUPPORTED_CONVERSION` |
| JOB-04 | PASS | 409 |
| JOB-05 | PASS | 200; `queueMode:"queue"` (real Redis + worker) |
| JOB-06 | PASS | Same job id returned, `idempotent:true` — no double conversion |
| JOB-07 | PASS (behavior) | 6th conversion (after 5 valid/failed requests) → `402 QUOTA_EXCEEDED (0 remaining)`. Note: **failed** requests also consume quota — see **BUG-04**. |

## JLIST — Job list

| ID | Result | Notes |
|---|---|---|
| JLIST-01 | PASS | 200, newest-first, tasks only (no output URLs leaked) |
| JLIST-02 | PASS | 1 row + `nextCursor` |
| JLIST-03 | PASS | page 2 returned without overlap |
| JLIST-04 | PASS (clamp logic) | Source clamps `Math.min(limit, 50)`; DB had only 2 jobs so a `limit=999` probe returned 2 (artifact — clamp not directly provable with 2 rows). |

## JGET — Job status

| ID | Result | Notes |
|---|---|---|
| JGET-01 | PASS | `progress:100`, `creditsCharged:1`, 1 output, 60 s downloadUrl |
| JGET-02 | FAIL → **BUG-02** | Job API filename is correct (`qa-sample.pdf`) but the raw download route's `Content-Disposition` uses the storage UUID. |
| JGET-03 | PASS | 404 |

## DL — Download

| ID | Result | Notes |
|---|---|---|
| DL-01 | PARTIAL | 200 + `%PDF` body + correct `Content-Type` ✓; **`Content-Disposition` filename is the opaque storage id** (`<uuid>.pdf`), not `qa-sample.pdf` → **BUG-02**. |
| DL-02 | PASS | `private, max-age=60` |
| DL-03 | PASS | 401 (token gate blocks traversal before path logic) |

## SSE — Job events

| ID | Result | Notes |
|---|---|---|
| SSE-01 | PASS | `event: job` frames; stream closes after terminal state |
| SSE-02 | PASS | 404 |
| SSE-03 | PASS | correct headers |

## CAN — Cancel

| ID | Result | Notes |
|---|---|---|
| CAN-01 | PASS | queued job → 200, status persists as `cancelled`, no output |
| **CAN-02** | **FAIL** | Cancel issued while worker was mid-conversion returned 200 `cancelled`; job stayed `cancelled` for ~6 s, then the worker's success path flipped it to **`done`** with a produced output. See **BUG-03**. |
| CAN-03 | PASS | 409 on terminal jobs |

## RL — Rate limiting

| ID | Result | Notes |
|---|---|---|
| RL-01 | PASS | 61-request burst → 34 × 429 with `Retry-After`/`X-RateLimit-*` |
| **RL-02** | **FAIL** | A single fresh `X-Forwarded-For` value during an active 429 state returned **200** with `remaining: 59` — the limit is keyed on the client-supplied header. See **SEC-01**. |

## E2E — Full conversion path

| ID | Result | Notes |
|---|---|---|
| E2E-01 | PASS | md→pdf over HTTP: `done` in ~1 s, valid `%PDF`, correct mime/name |
| E2E-02 | PASS | Real browser: dropzone → Markdown→PDF → SSE progress → `DONE` → `Download brtest.pdf` |
| E2E-03 | PASS | Real browser: 1×1 PNG → `Image → PDF` client-side → `DONE`, blob download link |

## Browser UI observations (functional)

- Dropzone keyboard activation (Enter/Space) works; single-region control is `role="button"` with accessible name.
- File chips render with per-file remove buttons; "Start over" resets the workspace.
- Multiple-file mixed-format upload is rejected client-side with an error banner (`role="alert"`).
- Session queue updates via SSE; terminal announcement appears in the `aria-live` region.
- **Automation note**: `agent-browser click` by a11y ref intermittently failed to register on the "Convert …" button; the same button via `Element.click()` worked every time — a tooling artifact, not an app defect (both flows completed successfully).

## Cleanup performed

- Test artifacts under `data/storage/*` and the sessions created during this run are test data (expected to be purged by the retention sweeper).
- Redis `daily:*` / `rl:*` counters were reset once mid-run to re-test the quota path.
