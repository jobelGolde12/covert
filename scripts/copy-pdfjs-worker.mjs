/**
 * Copies the PDF.js worker into public/vendor so the Web Worker can load it
 * as a plain static asset in both dev and prod. Importing it through webpack
 * (?url / new URL) is unreliable for .mjs in Next.js — see
 * documentation/technical-specifications.md §9.
 */
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "pdfjs-dist", "build", "pdf.worker.min.mjs");
const outDir = join(root, "public", "vendor", "pdfjs");
const out = join(outDir, "pdf.worker.min.mjs");

if (!existsSync(src)) {
  console.error("[pdfjs] worker source not found — run pnpm install first");
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, out);
console.log(`[pdfjs] worker copied → public/vendor/pdfjs/pdf.worker.min.mjs`);
