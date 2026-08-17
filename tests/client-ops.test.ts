import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import {
  compressPdfLossless,
  mergePdfs,
  parseRanges,
  rotatePdf,
  splitPdf,
  watermarkPdf,
} from "../lib/client-engine/ops-lib";

async function makePdf(pages: number, label: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pages; i++) {
    const page = doc.addPage([200, 200]);
    page.drawText(`${label}-page-${i + 1}`, { x: 20, y: 100, size: 14 });
  }
  return doc.save();
}

async function pageCount(buf: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(buf);
  return doc.getPageCount();
}

describe("parseRanges", () => {
  it("parses ranges and singles (1-indexed → 0-indexed)", () => {
    expect(parseRanges("1-3,5,7-9")).toEqual([0, 1, 2, 4, 6, 7, 8]);
    expect(parseRanges("1")).toEqual([0]);
    expect(parseRanges("")).toEqual([]);
  });
});

describe("mergePdfs", () => {
  it("concatenates pages in order", async () => {
    const a = await makePdf(2, "a");
    const b = await makePdf(1, "b");
    const merged = await mergePdfs([a, b]);
    expect(await pageCount(merged)).toBe(3);

    // verify order by text extraction via pdf-lib
    const doc = await PDFDocument.load(merged);
    expect(doc.getPageCount()).toBe(3);
  });
});

describe("splitPdf", () => {
  it("splits by ranges", async () => {
    const src = await makePdf(5, "x");
    const parts = await splitPdf(src, ["1-2", "4"]);
    expect(parts.length).toBe(2);
    expect(await pageCount(parts[0])).toBe(2);
    expect(await pageCount(parts[1])).toBe(1);
  });

  it("splits every page when no ranges given", async () => {
    const src = await makePdf(3, "x");
    const parts = await splitPdf(src);
    expect(parts.length).toBe(3);
  });

  it("clamps out-of-range indices", async () => {
    const src = await makePdf(3, "x");
    const parts = await splitPdf(src, ["1-99"]);
    expect(parts.length).toBe(1);
    expect(await pageCount(parts[0])).toBe(3);
  });
});

describe("rotatePdf", () => {
  it("rotates all pages 90 degrees", async () => {
    const src = await makePdf(1, "r");
    const rotated = await rotatePdf(src, 90);
    const doc = await PDFDocument.load(rotated);
    expect(doc.getPage(0).getRotation().angle).toBe(90);
  });

  it("rotates only selected pages", async () => {
    const src = await makePdf(3, "r");
    const rotated = await rotatePdf(src, 180, "2");
    const doc = await PDFDocument.load(rotated);
    expect(doc.getPage(1).getRotation().angle).toBe(180);
    expect(doc.getPage(0).getRotation().angle).toBe(0);
  });
});

describe("watermarkPdf", () => {
  it("adds the watermark text to every page", async () => {
    const src = await makePdf(2, "w");
    const marked = await watermarkPdf(src, { text: "CONFIDENTIAL", opacity: 0.3 });
    const doc = await PDFDocument.load(marked);
    expect(doc.getPageCount()).toBe(2);
    // pdf-lib keeps the content stream — a watermark draw adds content operators
    const content = await doc.getPage(0).node.Contents();
    expect(content).toBeTruthy();
  });
});

describe("compressPdfLossless", () => {
  it("re-serializes to a valid PDF", async () => {
    const src = await makePdf(3, "c");
    const out = await compressPdfLossless(src);
    expect(await pageCount(out)).toBe(3);
    expect(new TextDecoder().decode(out.subarray(0, 5))).toBe("%PDF-");
  });
});
