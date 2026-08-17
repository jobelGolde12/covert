import { describe, expect, it } from "vitest";
import {
  CONVERSIONS,
  FORMATS,
  conversionsFrom,
  detectFormat,
  findConversion,
  publicCatalog,
} from "../lib/conversions";

describe("conversion catalog", () => {
  it("has unique conversion ids", () => {
    const ids = CONVERSIONS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("references only known formats", () => {
    const formats = new Set(FORMATS.map((f) => f.format));
    for (const c of CONVERSIONS) {
      expect(formats.has(c.to), `${c.id} → ${c.to}`).toBe(true);
      // `from` entries are extensions — every one must resolve to a known format
      for (const from of c.from) {
        const resolved = detectFormat(`sample.${from}`);
        expect(resolved, `${c.id} from ${from}`).toBeDefined();
      }
    }
  });

  it("every conversion has valid limits and credits", () => {
    for (const c of CONVERSIONS) {
      expect(c.maxSizeMB).toBeGreaterThan(0);
      expect(c.priceCredits).toBeGreaterThan(0);
      expect(c.engine).toMatch(/^(libreoffice|pdf-lib|pdfjs|client)$/);
      expect(c.location).toMatch(/^(client|server)$/);
    }
  });

  it("client conversions never have server engines", () => {
    for (const c of CONVERSIONS.filter((c) => c.location === "client")) {
      expect(c.engine).not.toBe("libreoffice");
    }
  });

  it("covers all primary conversions from the spec", () => {
    const ids = CONVERSIONS.map((c) => c.id);
    for (const id of [
      "docx-pdf", "pdf-docx", "pptx-pdf", "xlsx-pdf", "pdf-xlsx",
      "image-pdf", "pdf-image", "html-pdf", "txt-pdf", "pdf-txt",
      "md-pdf", "pdf-md", "pdf-pptx", "pptx-docx", "docx-xlsx",
      "pdf-compress", "pdf-merge", "pdf-split", "pdf-rotate", "pdf-watermark",
    ]) {
      expect(ids, `missing ${id}`).toContain(id);
    }
  });

  it("looks up conversions both ways", () => {
    const c = findConversion("docx", "pdf");
    expect(c?.id).toBe("docx-pdf");
    expect(findConversion("pdf", "docx")?.id).toBe("pdf-docx");
    expect(findConversion("pptx", "xlsx")).toBeUndefined();
    expect(conversionsFrom("docx").map((x) => x.id)).toContain("docx-pdf");
  });

  it("detects formats from filename and mime", () => {
    expect(detectFormat("report.docx")).toBe("docx");
    expect(detectFormat("report.DOCX")).toBe("docx");
    expect(detectFormat("deck.pptx")).toBe("pptx");
    expect(detectFormat("scan.pdf")).toBe("pdf");
    expect(detectFormat("notes.md", "text/markdown")).toBe("md");
    expect(detectFormat("photo.png", "image/png")).toBe("png");
    expect(detectFormat("unknown.xyz")).toBeNull();
    expect(detectFormat("file", "application/pdf")).toBe("pdf");
  });

  it("publicCatalog is serializable (no functions or schemas)", () => {
    const cat = publicCatalog();
    for (const c of cat) {
      expect(typeof c.id).toBe("string");
      expect("optionsSchema" in c).toBe(false);
      expect("engine" in c).toBe(true);
    }
  });
});
