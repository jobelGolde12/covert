/**
 * PDF.js + canvas operations — Web Worker only (OffscreenCanvas).
 * Not imported by Node tests; exercised via E2E in the browser.
 */

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocument, rgb } from "pdf-lib";

// The worker is served as a static asset (copied by scripts/copy-pdfjs-worker.mjs)
// because webpack asset imports are unreliable for .mjs in Next.js dev mode.
GlobalWorkerOptions.workerSrc = "/vendor/pdfjs/pdf.worker.min.mjs";

export type ProgressFn = (percent: number, stage?: string) => void;

async function loadDoc(buffer: Uint8Array) {
  const task = getDocument({ data: buffer });
  return task.promise;
}

export interface TextPage {
  text: string;
  fontHeight: number; // max font height on the page (for heading heuristics)
}

/** Extract text per page. */
export async function pdfTextPages(buffer: Uint8Array, onProgress?: ProgressFn): Promise<TextPage[]> {
  const doc = await loadDoc(buffer);
  const pages: TextPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let maxHeight = 0;
    const parts: string[] = [];
    for (const item of content.items as { str?: string; transform?: number[] }[]) {
      if (typeof item.str === "string") {
        parts.push(item.str);
        const h = item.transform?.[3] ?? 0;
        if (h > maxHeight) maxHeight = h;
      }
    }
    pages.push({ text: parts.join(" "), fontHeight: maxHeight });
    onProgress?.(Math.round((i / doc.numPages) * 100), "Extracting text");
  }
  return pages;
}

export async function pdfToText(buffer: Uint8Array, onProgress?: ProgressFn): Promise<string> {
  const pages = await pdfTextPages(buffer, onProgress);
  return pages.map((p) => p.text.trim()).filter(Boolean).join("\n\n");
}

export async function pdfToMarkdown(buffer: Uint8Array, onProgress?: ProgressFn): Promise<string> {
  const pages = await pdfTextPages(buffer, onProgress);
  return pages
    .map((p) => {
      const h = p.fontHeight;
      const prefix = h >= 20 ? "## " : h >= 14 ? "### " : "";
      const body = p.text.trim();
      if (!body) return "";
      return prefix + body;
    })
    .filter(Boolean)
    .join("\n\n");
}

export interface RenderOptions {
  format?: "png" | "jpeg";
  scale?: number;
  pages?: string; // "all" or "1,3-5"
}

export async function pdfToImages(
  buffer: Uint8Array,
  opts: RenderOptions = {},
  onProgress?: ProgressFn
): Promise<{ blob: Blob; page: number }[]> {
  const doc = await loadDoc(buffer);
  const scale = opts.scale ?? 2;
  const format = opts.format ?? "png";
  const total = doc.numPages;
  const wanted = pickPages(opts.pages ?? "all", total);
  const results: { blob: Blob; page: number }[] = [];

  for (const pageNum of wanted) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport }).promise;
    const blob = await canvas.convertToBlob({ type: format === "png" ? "image/png" : "image/jpeg", quality: 0.92 });
    results.push({ blob, page: pageNum });
    onProgress?.(Math.round((results.length / wanted.length) * 100), "Rendering pages");
  }
  return results;
}

/** Compress by re-encoding pages as JPEG at a reduced scale (best for scan/image-heavy PDFs). */
export async function compressPdfViaRender(
  buffer: Uint8Array,
  level: "low" | "medium" | "high",
  onProgress?: ProgressFn
): Promise<Uint8Array> {
  const config = { low: { scale: 0.5, quality: 0.5 }, medium: { scale: 0.7, quality: 0.7 }, high: { scale: 1.0, quality: 0.85 } }[level];
  const doc = await loadDoc(buffer);
  const out = await PDFDocument.create();
  const total = doc.numPages;

  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i);
    const srcViewport = page.getViewport({ scale: 1 });
    const w = Math.ceil(srcViewport.width * config.scale);
    const h = Math.ceil(srcViewport.height * config.scale);
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx as unknown as CanvasRenderingContext2D, viewport: page.getViewport({ scale: config.scale }) }).promise;
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: config.quality });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const img = await out.embedJpg(bytes);
    // Rebuild the page at the original size, image fills the page
    const pdfPage = out.addPage([srcViewport.width, srcViewport.height]);
    pdfPage.drawImage(img, { x: 0, y: 0, width: srcViewport.width, height: srcViewport.height });
    onProgress?.(Math.round((i / total) * 100), "Re-encoding pages");
  }
  return out.save({ useObjectStreams: true });
}

/** Images → single PDF, one image per A4 page. */
export async function imagesToPdf(blobs: Blob[], mimes: string[], onProgress?: ProgressFn): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  const A4 = { w: 595.28, h: 841.89 };
  const margin = 24;

  for (let i = 0; i < blobs.length; i++) {
    const blob = blobs[i];
    const mime = mimes[i] ?? "image/jpeg";
    const bytes = new Uint8Array(await blob.arrayBuffer());

    let embed:
      | { width: number; height: number; embed: (pdf: PDFDocument) => Promise<import("pdf-lib").PDFImage> }
      | undefined;

    if (mime === "image/png") {
      embed = { width: 0, height: 0, embed: (pdf) => pdf.embedPng(bytes) };
    } else if (mime === "image/jpeg" || mime === "image/jpg") {
      embed = { width: 0, height: 0, embed: (pdf) => pdf.embedJpg(bytes) };
    } else {
      // webp/gif/bmp → decode via createImageBitmap, re-encode as JPEG
      const bmp = await createImageBitmap(blob);
      const canvas = new OffscreenCanvas(bmp.width, bmp.height);
      canvas.getContext("2d")!.drawImage(bmp, 0, 0);
      const jpeg = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.92 });
      const jpegBytes = new Uint8Array(await jpeg.arrayBuffer());
      const dims = { width: bmp.width, height: bmp.height };
      embed = { ...dims, embed: (pdf) => pdf.embedJpg(jpegBytes) };
    }

    const img = await embed.embed(out);
    const iw = img.width;
    const ih = img.height;
    const maxW = A4.w - margin * 2;
    const maxH = A4.h - margin * 2;
    const scale = Math.min(maxW / iw, maxH / ih, 1);
    const w = iw * scale;
    const h = ih * scale;

    const page = out.addPage([A4.w, A4.h]);
    page.drawImage(img, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });
    onProgress?.(Math.round(((i + 1) / blobs.length) * 100), "Building PDF");
  }
  return out.save({ useObjectStreams: true });
}

function pickPages(spec: string, total: number): number[] {
  if (spec === "all") return Array.from({ length: total }, (_, i) => i + 1);
  const out: number[] = [];
  for (const part of spec.split(",")) {
    const t = part.trim();
    const m = t.match(/^(\d+)-(\d+)$/);
    if (m) {
      for (let i = Number(m[1]); i <= Number(m[2]); i++) if (i >= 1 && i <= total) out.push(i);
    } else if (/^\d+$/.test(t)) {
      const n = Number(t);
      if (n >= 1 && n <= total) out.push(n);
    }
  }
  return out;
}

/** A subtle red dot used by the watermark UI preview — kept for future use. */
export const ACCENT = rgb(200 / 255, 16 / 255, 46 / 255);
