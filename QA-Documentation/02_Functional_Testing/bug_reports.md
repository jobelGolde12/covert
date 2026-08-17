# Bug Reports

All defects found during this QA run. **None were fixed** (test-only mandate). Severity per `01_Test_Plan/strategy.md` §5. Cross-references: `execution_results.md` case IDs.

---

## BUG-01 — Concurrent uploads fail with HTTP 500 (unique constraint collision on `storageKey: "pending"`)

- **Severity:** High
- **Component:** `POST /api/v1/files/upload` → `prisma.file.create`
- **Files:** `app/api/v1/files/upload/route.ts:44-57`, `prisma/schema.prisma:58` (`storageKey String @unique`)

**Description**
Every upload row is created with the placeholder `storageKey: "pending"` and then updated to its real key (`files/<id>/<id>.<ext>`) on the very next line. The `@unique` constraint therefore allows only one row at a time to hold `"pending"`. Under concurrency, a second simultaneous upload violates the unique index before the first row is updated.

**Reproduction**
```bash
for i in $(seq 1 20); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/v1/files/upload \
    -H 'content-type: application/json' -d '{"filename":"c'"$i"'.md","mimeType":"text/markdown","sizeBytes":100}' &
done; wait
```
Result: **6× 200, 14× 500**.

Server log:
```
Unique constraint failed on the fields: (`storageKey`)
```

**Impact**
- The upload API — the entry point of the core product flow — intermittently returns 500 (70% failure at 20 concurrent requests). This is not an exotic scenario: multiple browser tabs, two users, or the multiple-file UI submitting in parallel all trigger it.
- The 500 response bypasses the `{error:{code,message}}` envelope (the Prisma error is uncaught), so clients receive a generic crash body.

**Expected fix (for the maintainer)**
- Generate the file UUID first and create the row directly with its final `storageKey` (the placeholder is unnecessary), or wrap the create/update pair in a transaction that never exposes `"pending"` to the unique index.

---

## BUG-02 — Download `Content-Disposition` filename is the storage UUID, not the friendly filename

- **Severity:** Low
- **Component:** `GET /api/v1/files/download`
- **Files:** `app/api/v1/files/download/route.ts:33` (`const filename = key.split("/").pop() ?? "download";`)

**Description**
Direct downloads serve with `Content-Disposition: attachment; filename="<uuid>.pdf"` — the storage object name — instead of the user-facing filename stored in the `File` row (`qa-sample.pdf`). The route only has the signed storage `key` and never resolves it to the `File` metadata.

**Reproduction**
```bash
# after an md→pdf conversion, take the output downloadUrl and:
curl -s -D - -o /dev/null "<downloadUrl>" | grep -i content-disposition
# => attachment; filename="<uuid>.pdf"   (expected: qa-sample.pdf)
```

**Impact**
- Cosmetic/functional: saved files lose their human-friendly name when fetched directly from the API. (The web UI is unaffected — the queue uses the `File.filename` from the job API.)

---

## BUG-03 — Cancelling an in-flight job is accepted (200) but the worker later overwrites the state to `done`

- **Severity:** Medium
- **Component:** `POST /api/v1/jobs/[id]/cancel` + office worker
- **Files:** `lib/jobs.ts:110-114` (entry guard), `lib/jobs.ts:187-195` (unconditional `status: "done"` on success), `lib/jobs.ts:342-353` (`cancelJob`)

**Description**
`cancelJob` updates the DB row to `cancelled` and asks BullMQ to `remove()` the job. If the worker has already **claimed** the job, `remove()` is a no-op and the conversion continues. `processOfficeJob` checks `job.status === "cancelled"` only at function entry; on success it unconditionally writes `status: "done"` and produces an output. Net effect: the API answers 200 `cancelled`, the client sees `cancelled` for several seconds, then the job silently flips to `done` and the output is created anyway.

**Reproduction**
1. Upload a large markdown and create a job so conversion takes ~8 s.
2. Poll until status is `processing` (worker has claimed it).
3. `POST /jobs/<id>/cancel` → **200**.
4. Poll: `cancelled` for ~6 s, then `done`.

Observed in this run:
```
t0 poll: processing
cancel returned HTTP 200
  poll: cancelled  (×6)
re-poll after 6s: done        ← worker overwrote the cancellation
[office] job <id> started
[office] job <id> finished
```

**Impact**
- State-machine violation: an acknowledged cancellation is not honored for in-flight conversions; user is charged for a conversion they were told was cancelled, and the file is retained.
- Races in a single-worker deployment are timing-dependent, making the behavior hard to reason about.

**Expected fix (for the maintainer)**
- Re-check the job status **after** the engine completes (before writing `done`/creating the output), or store a cancellation marker and have the worker honor it at each progress gate.

---

## BUG-04 — Failed/duplicate job requests consume the anonymous daily conversion quota

- **Severity:** Medium
- **Component:** `POST /api/v1/jobs`
- **Files:** `app/api/v1/jobs/route.ts:44-50` (`incrementDaily` runs **before** `createServerJob` validation)

**Description**
`incrementDaily(...)` executes before the payload is validated against the file/conversion state. Every request that reaches that point — including ones that will fail with 404 (unknown file), 409 (file not ready), or 422 (unsupported conversion) — decrements the `ANON_CONVERSIONS_PER_DAY` allowance. A user who mis-fires a few requests can lock themselves out of the remaining quota for the day.

**Reproduction (cumulative counter shown in one run)**
1. Submit 1 valid conversion → quota 5→4.
2. Submit 3 invalid requests (404/409/422) → quota 4→1.
3. Next valid attempt → `402 QUOTA_EXCEEDED (0 remaining)` — the 6th request overall, not the 6th *valid* conversion.

**Impact**
- Legitimate users lose paid-for/limited quota through their own API errors; a hostile caller can also self-DoS a victim sharing the same IP bucket (compounded by SEC-01).
- Idempotent replays are correctly exempt (idempotency check runs first) — only genuinely new-but-invalid attempts are the problem.

**Expected fix (for the maintainer)**
- Validate the job spec (file exists, `ready`, conversion supported) before incrementing the counter, or refund/re-credit on failure.

---

## Test artifacts (not defects — recorded for completeness)

These four failures in `execution_results.md` were expectations errors in the QA harness, not product bugs:

1. `FMT` probe for a `pdf_to_html` id — the catalogue has no such entry (uses `docx-html`/`html-pdf` etc.).
2. `JLIST-04` clamp probe — only 2 jobs existed in the DB, so `limit=999` returned 2; the clamp code (`Math.min(limit, 50)`) is correct.
3. `CAN` queued-cancel flow failed only because the preceding requests had exhausted the daily quota, so the "job" was never created (`CQJOB=null` → 409).
4. `FIL-05`/delete reached while the rate-limit burst was still within its 60 s window → 429.
