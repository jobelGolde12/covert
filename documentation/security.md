# Convert — Security & Compliance

> **Product:** Convert — document conversion platform.
> Security model covering file handling, data privacy, encryption, authentication, and compliance (GDPR, CCPA). The security posture is informed by the practices of leading conversion platforms (iLovePDF's end-to-end encryption + short retention, CloudConvert's scoped keys + sandbox) — adapted and extended for our architecture.
>
> **Design compliance:** the privacy center, consent banner, and settings UI implement `design.md` (restrained palette, clear hierarchy, accessible focus states per `design.md` §27).

---

## 1. Threat Model (Summary)

| Asset | Primary threats |
|---|---|
| Uploaded documents | Theft at rest/in transit, unauthorized access by other users, retention leakage |
| User accounts | Credential stuffing, session hijacking, OAuth account linking |
| API keys | Leakage (logs, client bundles), abuse |
| Processing fleet | Malicious files (macro, zip-bomb, decompression bombs, PDF exploits), SSRF |
| Webhooks | Signature forgery, replay |
| Infrastructure | DDoS, credential exposure via CI |

---

## 2. File Handling Security (Inputs are untrusted)

Every uploaded file is treated as **untrusted attacker input** (conversion engines have had real CVEs — parsing office/PDF files is a classic attack surface).

1. **Upload validation (API, pre-storage):**
   - Extension + MIME allowlist against the conversion catalog (`lib/conversions.ts`). `415 UNSUPPORTED_FORMAT` otherwise.
   - Size cap per plan (25 MB / 100 MB / 500 MB). `413 FILE_TOO_LARGE`.
   - **Magic-byte sniffing** (`file-type` lib) — reject files whose declared type doesn't match content (kills disguised executables/macros).
   - Reject polyglot files where feasible (e.g., OLE header present in a ".pdf").
2. **Storage:** immutable random keys (`files/<uuid>/<uuid>.<ext>`), no user-controlled path segments → **path traversal impossible**; no overwrite/rename endpoints.
3. **Processing sandbox:**
   - Workers run as **non-root** (USER 10001) with **no network egress except R2/Redis/DNS** (network policy).
   - LibreOffice: macros **disabled** (`--headless` + `MacroSecurity` policy), isolated user profile per job, `seccomp` profile.
   - Puppeteer: `--no-sandbox --disable-dev-shm-usage` inside an **ephemeral, disposable container**; page never reaches the internet (blocked via `page.setRequestInterception` allowlist).
   - **Zip-bomb guard:** extraction byte/entry caps (`unzip -l` pre-check; max ratio 100:1).
   - **PDF bomb guard:** page-count cap (1000) and page-size checks before rendering; PDF.js renders page-by-page with a canvas pixel budget.
   - **Timeouts** on every engine (15/30 min) → job killed, no orphan processes.
4. **Post-processing:** output files are re-validated (magic bytes, size, page count) before being marked `done`; outputs that fail validation are discarded with `CONVERSION_FAILED`.
5. **Downloads:** only via short-lived presigned URLs (60 s) tied to the owner's identity; objects are private by default (bucket policy denies all anonymous access; CDN never caches R2 objects unless explicitly public).

---

## 3. SSRF Protection (Import-URL feature)

`POST /v1/files/import-url` fetches URLs server-side → SSRF risk. Mitigations:

- DNS resolution checked against **denylist** (private/loopback/link-local ranges, cloud metadata IPs `169.254.169.254`, `100.64.0.0/10`).
- Connection forced through a **proxy that only allows public egress**; destination re-resolved at connect time (DNS rebinding guard — resolve, connect to resolved IP, verify it's still the same IP).
- Redirects capped at 3; schemes limited to `http`/`https`.
- Response size capped at plan limit; content-type checked.
- Documented in code + covered by integration tests (`plan/testing-strategy.md` §Security testing).

---

## 4. Encryption

| Layer | Mechanism |
|---|---|
| In transit (client ↔ API/CDN) | TLS 1.2+ (HSTS, 2-yr preload), WebSocket over WSS only |
| In transit (internal) | TLS for Turso (libSQL TLS), Redis TLS, R2 HTTPS |
| At rest — objects (R2) | **SSE-S3 server-side encryption** (AES-256) enabled at bucket level |
| At rest — database (Turso) | Encryption at rest (Turso platform default); sensitive columns (email) never stored in plaintext logs |
| Secrets | Injected at runtime; hashed API keys; `NEXTAUTH_SECRET` never logged |
| User-supplied PDF passwords | Used **in-memory only** for decrypt; `protectPassword` output encryption is AES-256 (pdf-lib) — passwords are never persisted, logged, or sent to analytics |

**End-to-end option:** for enterprise plans, we support **client-side encryption** of the input before upload (outputs are decrypted client-side after download). This makes server-side processing of encrypted payloads impossible for *fully private* flows — so it is offered only for the **client-side conversions** (merge/split/rotate/watermark/compress/image→PDF), which never leave the device anyway. Server-side conversions of client-encrypted files are out of scope and clearly labeled in the UI ("for maximum privacy, choose a browser-side conversion").

---

## 5. Authentication & Session Security

1. **NextAuth.js v5** with Google/GitHub OAuth + email magic links (passwordless default — no password DB to leak; `passwordHash` column exists but is unused at launch).
2. **JWT sessions:** short-lived access JWT (15 min) + httpOnly, `Secure`, `SameSite=Lax` refresh cookie. CSRF tokens for state-changing routes.
3. **Session revocation:** logout rotates the JWT secret seed per user (Redis `revoked_sessions:<userId>` set); admin tools can force-logout a user.
4. **Brute-force protection:** login/IP rate limits + exponential lockout; magic-link tokens single-use, 10 min TTL.
5. **OAuth account-linking** requires email verification before merging identities (prevents account takeover via OAuth email collision).
6. **2FA** for admin/enterprise accounts (TOTP).

### API keys

- Format `convert_live_<32B base62>`; **SHA-256 hash stored** — DB leak exposes no usable keys.
- Scoped (`jobs:read`, …), revocable instantly, expirable; `lastUsedAt` surfaced in dashboard.
- Rotation guidance: create new key → migrate → revoke old (dashboard shows grace period).
- Never accept keys in query strings; header only.

---

## 6. Headers & CSP

```text
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' (dev) https://challenges.cloudflare.com;
  worker-src 'self' blob:;
  connect-src 'self' wss://api.convert.app https://*.r2.cloudflarestorage.com https://api.stripe.com;
  img-src 'self' data: blob: https://*.r2.cloudflarestorage.com;
  style-src 'self' 'unsafe-inline';
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

- Web Workers use `worker-src blob:` (bundles loaded from blob URLs).
- R2 `connect-src`/`img-src` are the only third-party origins; Google Drive/Dropbox OAuth adds their origins when the feature is enabled for a user.

---

## 7. Data Privacy & Retention

### 7.1 Retention (mirrors competitor norms; documented in UI)

| Tier | Processing files | History |
|---|---|---|
| Anonymous | **1 hour** | not stored |
| Free | 24 hours | 90 days (then archived) |
| Pro / Business | 7 days | 90 days |
| Enterprise | configurable (up to 30 days) | configurable |

- A **sweeper** deletes expired objects + rows every 15 min (see `database-schema.md` §6).
- Files are **deleted, not anonymized** — object removal from R2 is the primary deletion (R2 bucket lifecycle enforces a 24 h hard-delete even if the sweeper fails).

### 7.2 Privacy principles

- **Client-side conversions never upload** — this is the headline privacy feature and is enforced at the architecture level (browser library has no upload path).
- **No file-content access by staff.** Support tooling sees only metadata + error codes (never document text). This is enforced technically (workers have no shell/DB access; logs redact content-derived fields).
- **Analytics** use aggregated counts (conversions by format, bytes) — never filenames, hashes of content, or sampled document text.
- **PII minimization:** email/name stored only for registered users; anonymous sessions carry no PII.
- **Data Processing Agreement (DPA)** in the signup flow for business/enterprise.

---

## 8. Compliance

### 8.1 GDPR (EU)

- **Lawful bases:** consent (account), contract (paid service), legitimate interest (fraud/security). Documented in the Privacy Policy.
- **Rights:** access, rectification, erasure (account deletion = full cascade), data portability (export jobs/history as JSON), restriction, objection. All exposed in Settings → "Privacy" and as a documented API flow.
- **DPO contact** + EU representative published.
- **Data residency:** Turso **EU-primary** option (region pinning `eu-central`) and R2 EU bucket for EU customers; per-account region selection (regional API endpoints from `api-documentation.md` §Base URL).
- **Breach notification:** 72 h via internal runbook; documented playbooks in `deployment.md` §Incident Response.
- **DPAs** with subprocessors (Vercel, Turso, Upstash, Cloudflare, Stripe, Resend, Sentry, PostHog) — maintained in the vendor register.

### 8.2 CCPA/CPRA (California)

- Notice at collection; **Do Not Sell/Share** toggle (no data selling occurs; toggle still honored for marketing pixels).
- Right to know/delete/opt-out; verified-request process with the same account-deletion flow.
- Age gate: no service for under-16; privacy policy states we do not knowingly collect children's data.

### 8.3 Other

- **SOC 2 Type II** roadmap (Phase 3, `plan/implementation-roadmap.md`) — controls mapping table maintained in `security/controls.md` (internal).
- **ISO 27001** considered post-SOC 2; **EU AI Act** N/A (no AI processing of documents at launch; OCR is rule-based Tesseract — documented).
- **Accessibility** is a product requirement, not just compliance: WCAG 2.1 AA per `design.md` §27 and `user-guide.md` §Accessibility.

---

## 9. Rate Limiting & Abuse Prevention

- Redis sliding-window per identity (API key / IP / user) — full matrix in `api-documentation.md` §2.
- **Anonymous abuse:** per-IP daily conversion caps + IP reputation (Cloudflare) + CAPTCHA after N anonymous conversions.
- **Storage DoS:** anonymous users get a hard storage quota (e.g., 500 MB total) enforced at upload; free users 5 GB.
- **Queue abuse:** max concurrent jobs per key; job priority inversion (paid users ahead of free in the Bull queue).
- **DDoS:** Cloudflare WAF + rate rules in front of API; `frame-ancestors 'none'` kills clickjacking.

---

## 10. Webhook Security

- `X-Convert-Signature: t=<ts>,v1=<hmac-sha256(secret, t.body)>` — verify with constant-time compare (`api-documentation.md` §11.2).
- Replay window ±5 min; delivery retries with backoff; permanent-failure semantics documented.
- Endpoint URL must be `https://` (enforced); secrets hashed at rest, shown once.

---

## 11. Logging, Monitoring & Incident Response

- Structured logs with **PII redaction** at the edge (regex + field allowlist; filenames replaced with `[redacted]` unless allowlisted by format). No passwords, no document contents, no full API keys (only `convert_live_ab12…` prefix).
- **Sentry** for application errors (source maps), **Grafana/OTel** for metrics/traces, **Cloudflare analytics** for edge.
- **Alerts:** auth-failure spikes, rate-limit saturation, anomalous bytes-per-user, queue starvation, webhook failure rate.
- **Runbooks:** (1) account-takeover report, (2) data breach, (3) malicious-file outbreak (engine CVE), (4) DDoS, (5) dependency CVE. Each has owner, steps, and postmortem template.
- **Responsible disclosure:** `security@convert.app`, PGP key published; `security.txt` at `/.well-known/security.txt`; Hall of Fame. Bug-bounty program in Phase 3.

---

## 12. Security Checklist (Pre-Launch Gate)

- [ ] CSP + HSTS + all security headers verified (securityheaders.com score A+)
- [ ] Workers non-root, no egress except allowlist, seccomp profiles
- [ ] SSRF tests for import-url (private IP, DNS rebinding, metadata)
- [ ] Zip-bomb & PDF-bomb test corpus in CI
- [ ] Magic-byte validation on all uploads
- [ ] API key hashing + scope enforcement tested
- [ ] Webhook signature verification test (tampered payload)
- [ ] Retention sweeper verified (R2 lifecycle as backstop)
- [ ] GDPR/CCPA flows live (deletion, export, residency option)
- [ ] Pen test (external) scheduled; DAST in CI (OWASP ZAP)
- [ ] Dependabot + `npm audit` clean; SBOM published
