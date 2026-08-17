# Convert — User Guide

> **Product:** Convert — *"Document conversion with style and substance."*
> Everything end users need: feature explanations, step-by-step guides, troubleshooting, and FAQ. The interface implements the design system in `design.md` — a calm, editorial, white-first layout with a restrained red accent (`#C8102E`) and dark CTAs.

---

## 1. What is Convert?

Convert converts documents between **Word, PDF, PowerPoint, Excel, images, HTML, Markdown, and text**, plus everyday PDF utilities (merge, split, rotate, watermark, compress). It runs in your browser — no software to install, nothing to download except your converted file.

**Two kinds of conversions:**

- **Browser-side (private by default):** merging, splitting, rotating, watermarking, compressing PDFs, image→PDF, and PDF→image/text/markdown run entirely on *your* device. **Your files never leave your computer.** (This is why a 500 MB PDF merge is instant and why the privacy badge says "On your device".)
- **Server-side:** converting office formats (Word/PPT/Excel ↔ PDF and between each other) needs a real office engine, so files are processed on our secure servers and **deleted automatically within 1 hour (guests), 24 hours (free), or 7 days (paid)**.

---

## 2. Quick Start

### Convert a file in 3 steps

1. **Drop your file** anywhere on the converter (or click to browse; paste from clipboard also works).
2. **Pick the target format** — the dropzone shows only valid targets; click a tile.
3. **Download the result.** Browser-side conversions are ready instantly; server-side ones show a progress bar and finish in seconds.

### 2.1 Word → PDF

1. Open **Convert** → **Word to PDF**.
2. Drop a `.docx`/`.doc` file (up to 100 MB on paid plans).
3. Wait for the progress bar (typically < 10 s for a 10-page document) and click **Download**.

> Tip: choose "Flatten layout" in options if you want the PDF to lock the current page layout exactly.

### 2.2 PDF → Word (editable)

1. **Convert** → **PDF to Word**.
2. Drop your PDF.
3. Optionally enable **OCR** (for scanned documents — adds ~2 credits and more time).
4. Download the `.docx`. Layout fidelity is high for text-based PDFs; scanned pages without OCR become embedded images.

### 2.3 Merge / Split / Rotate / Watermark (PDF)

All four run **on your device**:

- **Merge:** drop multiple PDFs in order (drag to reorder), click **Merge**.
- **Split:** drop one PDF, enter ranges like `1-3`, `4-5`, `6` (or choose "Every page").
- **Rotate:** select pages, pick 90°/180°/270°, apply.
- **Watermark:** type text (or upload an image), set size/opacity/rotation, apply. Watermarks are never stored on our servers.

### 2.4 PDF compression

Drop a PDF → choose **Low / Medium / High / Lossless** → **Compress** → download. Everything happens locally. "High" targets ~50–70% size reduction for scan-heavy PDFs (JPEG re-encode); "Lossless" only strips redundancy.

### 2.5 Excel → PDF and beyond

Drop `.xlsx`/`.xls`/`.csv` → **to PDF** (print-friendly, one sheet per page). Server-side conversions (Excel↔PDF, Word↔PPT, PDF→PPT, etc.) are listed in **All conversions** — 28 conversions total.

---

## 3. Features in Detail

### 3.1 Drag-and-drop & paste

- Drop files anywhere on the page; drop **multiple** files for batch/merge.
- Paste an image from the clipboard (Ctrl/⌘+V) to start image→PDF.
- Keyboard: `Tab` to the dropzone, `Enter` to open the file picker.

### 3.2 Batch conversion

Convert many files with the same settings:

1. Drop up to **50 files** (or choose a folder).
2. Pick the target format once.
3. Convert queues them (parallel, up to your plan's concurrency) with per-file progress.
4. Download each result, or **Download all as ZIP** (ZIP is created client-side for browser conversions).

### 3.3 Cloud storage (Google Drive, Dropbox)

- **Import:** Connect Drive/Dropbox once (OAuth) → pick files from your drive inside the converter.
- **Export:** save results straight back to a chosen Drive/Dropbox folder.
- Files are processed the same way as uploads and subject to the same retention. You can revoke access anytime in **Settings → Connected apps**.

### 3.4 User accounts & history

- **Sign up** with Google, GitHub, or email magic link — no password needed.
- **History** keeps your last 90 days of conversions (metadata only — inputs/outputs are deleted per retention; for server conversions you can re-download outputs during the retention window).
- **Anonymous?** No history is stored; your file is deleted after 1 hour. Nothing links back to you.

### 3.5 OCR (scanned documents)

- Use **PDF to Word / Excel** with **OCR** enabled, or the dedicated **Make PDF searchable** tool.
- Supported languages at launch: English, German, Spanish, French, Portuguese (more via Settings → OCR language).
- Works best on clean scans (300 DPI); handwriting is not supported.

### 3.6 Password protection & encrypted PDFs

- **Open encrypted PDFs:** when a PDF requires a password, Convert prompts you — the password is used in memory only and never stored or logged.
- **Protect output:** when converting to PDF, set **"Protect with password"** to encrypt the output (AES-256). The password is your own; if you lose it, the file cannot be recovered (and neither can we help — it's encrypted).

### 3.7 API for developers

Developers can automate all of this: `POST /v1/jobs`, webhooks, SDKs, 28 formats. See `api-documentation.md`; developer docs live at `docs.convert.app`.

### 3.8 Offline use (PWA)

Install Convert from your browser menu (**Add to Home Screen**). Browser-side conversions (merge, split, rotate, watermark, compress, image→PDF, PDF→text) work **fully offline**; queued jobs complete when you're back online.

---

## 4. Plans & Limits

| | Anonymous | Free | Pro | Business |
|---|---|---|---|---|
| Price | — | $0 | $9/mo | $29/mo |
| Conversions/day | 5 | 20 | 500 | unlimited (fair use) |
| Max file size | 25 MB | 100 MB | 500 MB | 2 GB |
| Batch size | 10 files | 25 files | 50 files | 100 files |
| OCR | — | 5 pages/job | 100 pages/job | 500 pages/job |
| File retention | 1 hour | 24 hours | 7 days | 7 days (30 d optional) |
| History | — | 90 days | 90 days | 90 days |
| API + webhooks | — | — | ✅ | ✅ |
| No file-size watermark | — | — | ✅ | ✅ |

Daily limits reset at midnight UTC. Unused daily allowance does not roll over.

---

## 5. Step-by-Step Troubleshooting

| Symptom | Cause & fix |
|---|---|
| "File type not supported" | The format isn't in our catalog (e.g., `.pages`, `.odt` → check All conversions; we support 30+ input types). Re-export to `.docx`/`.pdf` first. |
| "Failed to open the file" | The file is corrupt or a renamed file with the wrong extension. Open it in its original app, save as the correct type, retry. |
| "PDF requires a password" | Enter the password when prompted. Convert can't bypass PDF encryption — if you don't know it, use the document owner's password. |
| Watermark looks pixelated | Use text watermarks (rendered as vector); for image watermarks use a PNG/SVG with transparency, 300+ px. |
| Layout changed after PDF→Word | Expected for complex layouts. Enable OCR for scanned text; for tables, convert PDF→Excel and fix in Excel. |
| Conversion stuck at "queued" | Rare — usually engine fleet saturation. Wait up to 2 min; if still queued, cancel and retry. |
| Download expired | Output links expire after 60 s; re-open the conversion from History to get a fresh link (within retention). |
| Huge Excel file (100k+ rows) → PDF | Freezes server-side limits; split the sheet or reduce print area first. |
| Fonts look wrong in converted PDF | We bundle Liberation/DejaVu fonts (metric-compatible with Arial/Times). For exact corporate fonts, embed them in the source document before conversion. |
| OCR quality is poor | Re-scan at 300 DPI, ensure text isn't skewed; try "Make PDF searchable" with the correct language selected. |
| "Your device is out of memory" (browser conversion) | A very large PDF (300+ MB) hit the browser's memory ceiling. Use Chrome/Edge desktop, close other tabs, or retry as a server conversion (Pro plan allows 500 MB). |

**Still stuck?** `support@convert.app` — include the job/error code shown in the red banner (e.g., `CONVERSION_FAILED · 01HZY-...`). We don't see your file contents, so no need to redact.

---

## 6. FAQ

**Is it free?** Anonymous users get 5 conversions/day, all browser-side conversions are unlimited and free forever. Paid plans add server-side volume, larger files, OCR, and the API.

**Are my files private?** Browser-side conversions never leave your device. Server-side files are encrypted in transit and at rest, processed in isolated containers, and auto-deleted after 1 h / 24 h / 7 days. We never access file contents — see `security.md`.

**How is this different from other converters?** Most converters upload every file to their servers. Convert keeps merge/split/rotate/watermark/compress and image→PDF entirely on-device (zero upload, works offline), and server conversions get industry-leading retention cleanup.

**Can I convert a scanned PDF to editable Word?** Yes — enable OCR (paid plans) or use the searchable-PDF tool.

**What's the max file size?** 25 MB anonymous, 100 MB free, 500 MB Pro, 2 GB Business.

**Do you store my Drive/Dropbox files?** No — we only fetch the file you select, process it, and delete per retention. OAuth access is revocable at any time.

**Is there a desktop app?** Convert is a PWA — install it from the browser for an app-like experience with offline support.

**Do you support mobile?** Yes — fully responsive (design.md §15: mobile reflows the hero and converter into a single-column flow), with the same limits as desktop.

**What about `.heic` (iPhone photos)?** Supported for image→PDF and image conversions (server-side, since iOS HEIC needs native decoding).

---

## 7. Accessibility (design.md §27)

- Full keyboard operation: all controls reachable and operable by `Tab`/`Enter`/`Space`; visible focus rings on every interactive element.
- Screen-reader friendly: semantic landmarks, ARIA labels on dropzones ("Drop PDF files here"), live regions announce conversion progress, descriptive alt text on all imagery.
- Contrast: WCAG 2.1 AA — text `#171717` on white; the red accent `#C8102E` is used only for CTAs/active states and passes AA at button sizes.
- `prefers-reduced-motion`: all animations collapse to instant transitions.
- Language: full UI translations (`en/de/es/fr/pt/ja`), `lang` attributes, and RTL-ready layout.

---

## 8. Internationalization & SEO

- **i18n:** locale selector in the footer; URLs are `/de/convert`, `/es/convert` etc. Dates/numbers localized via `Intl`.
- **SEO:** per-locale sitemaps + hreflang, semantic headings, structured data (SoftwareApplication + FAQPage schema) on the landing page, Open Graph/Twitter cards for sharing conversions. Content pages ("How to convert PDF to Word", etc.) follow the editorial typography of `design.md`.
- **Analytics:** privacy-friendly aggregate analytics (no cookies for EU users until consent; CCPA opt-out honored — see `security.md` §8).

---

## 9. Legal & Privacy Shortcuts

- Privacy policy, terms, and cookie policy linked in the footer and during signup.
- Account deletion: **Settings → Delete account** → instant full erasure (GDPR/CCPA). Data export available before deletion.
- Data residency: EU customers can pin processing to EU regions in Settings (Business plan+).
- Security contact: `security@convert.app`.
