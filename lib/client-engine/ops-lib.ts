import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

/**
 * pdf-lib operations — run in a Web Worker (private by default).
 * Pure functions over Uint8Array so they are unit-testable in Node.
 */

export async function mergePdfs(buffers: Uint8Array[]): Promise<Uint8Array> {
  const out = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await out.copyPages(src, src.getPageIndices());
    for (const page of pages) out.addPage(page);
  }
  return out.save({ useObjectStreams: true });
}

export function parseRanges(spec: string): number[] {
  // "1-3,5,7-9" → [0,1,2,4,6,7,8] (1-indexed input, 0-indexed output)
  const out: number[] = [];
  for (const part of spec.split(",")) {
    const t = part.trim();
    if (!t) continue;
    const m = t.match(/^(\d+)-(\d+)$/);
    if (m) {
      const a = Math.max(1, Number(m[1]));
      const b = Number(m[2]);
      for (let i = a; i <= b; i++) out.push(i - 1);
    } else if (/^\d+$/.test(t)) {
      out.push(Number(t) - 1);
    }
  }
  return out;
}

/** Split: returns one PDF per range (or per page when ranges is empty). */
export async function splitPdf(buffer: Uint8Array, ranges?: string[]): Promise<Uint8Array[]> {
  const src = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = src.getPageCount();

  let groups: number[][] = [];
  if (ranges && ranges.length) {
    groups = ranges.map((r) => parseRanges(r).filter((i) => i >= 0 && i < total));
  } else {
    groups = Array.from({ length: total }, (_, i) => [i]);
  }
  groups = groups.filter((g) => g.length > 0);

  const results: Uint8Array[] = [];
  for (const group of groups) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(src, group);
    for (const page of pages) out.addPage(page);
    results.push(await out.save({ useObjectStreams: true }));
  }
  return results;
}

export async function rotatePdf(buffer: Uint8Array, angle: 90 | 180 | 270, pages?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const total = doc.getPageCount();
  const targets = pages && pages !== "all" ? parseRanges(pages).filter((i) => i >= 0 && i < total) : Array.from({ length: total }, (_, i) => i);
  for (const i of targets) {
    const page = doc.getPage(i);
    page.setRotation(degrees((page.getRotation().angle + angle) % 360));
  }
  return doc.save({ useObjectStreams: true });
}

export interface WatermarkOptions {
  text: string;
  fontSize?: number;
  opacity?: number;
  rotation?: number; // degrees
  color?: string;    // hex
}

export async function watermarkPdf(buffer: Uint8Array, opts: WatermarkOptions): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = opts.fontSize ?? 28;
  const opacity = opts.opacity ?? 0.18;
  const rotation = opts.rotation ?? -30;
  const color = hexToRgb(opts.color ?? "#111111");

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(opts.text, fontSize);
    page.drawText(opts.text, {
      x: (width - textWidth) / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(rotation),
    });
  }
  return doc.save({ useObjectStreams: true });
}

/** Lossless-ish compression: re-serializes the document, dropping unused objects. */
export async function compressPdfLossless(buffer: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
  return doc.save({ useObjectStreams: true });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "");
  const v = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return { r: ((v >> 16) & 255) / 255, g: ((v >> 8) & 255) / 255, b: (v & 255) / 255 };
}
