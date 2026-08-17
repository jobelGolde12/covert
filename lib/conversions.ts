import { z } from "zod";

/**
 * Conversion catalog — single source of truth (see documentation/architecture.md §2).
 * Drives the UI (format picker), API validation, and the LibreOffice worker.
 */

export type Engine = "libreoffice" | "pdf-lib" | "pdfjs" | "client";
export type Location = "client" | "server";
export type Category =
  | "office-to-pdf"
  | "pdf-to-office"
  | "office-to-office"
  | "pdf-tools"
  | "image"
  | "text"
  | "web";

export interface FormatDef {
  format: string;
  label: string;
  extensions: string[];
  mimes: string[];
  group: "document" | "presentation" | "spreadsheet" | "image" | "text" | "web";
}

export const FORMATS: FormatDef[] = [
  { format: "pdf",  label: "PDF",          extensions: ["pdf"],                          mimes: ["application/pdf"], group: "document" },
  { format: "docx", label: "Word",         extensions: ["docx"],                         mimes: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"], group: "document" },
  { format: "doc",  label: "Word (legacy)",extensions: ["doc"],                          mimes: ["application/msword"], group: "document" },
  { format: "rtf",  label: "RTF",          extensions: ["rtf"],                          mimes: ["application/rtf", "text/rtf"], group: "document" },
  { format: "pptx", label: "PowerPoint",   extensions: ["pptx"],                         mimes: ["application/vnd.openxmlformats-officedocument.presentationml.presentation"], group: "presentation" },
  { format: "ppt",  label: "PowerPoint (legacy)", extensions: ["ppt"],                   mimes: ["application/vnd.ms-powerpoint"], group: "presentation" },
  { format: "xlsx", label: "Excel",        extensions: ["xlsx"],                         mimes: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"], group: "spreadsheet" },
  { format: "xls",  label: "Excel (legacy)", extensions: ["xls"],                        mimes: ["application/vnd.ms-excel"], group: "spreadsheet" },
  { format: "csv",  label: "CSV",          extensions: ["csv"],                          mimes: ["text/csv"], group: "spreadsheet" },
  { format: "txt",  label: "Text",         extensions: ["txt"],                          mimes: ["text/plain"], group: "text" },
  { format: "md",   label: "Markdown",     extensions: ["md", "markdown"],               mimes: ["text/markdown", "text/x-markdown"], group: "text" },
  { format: "html", label: "HTML",         extensions: ["html", "htm"],                  mimes: ["text/html"], group: "web" },
  { format: "epub", label: "EPUB",         extensions: ["epub"],                         mimes: ["application/epub+zip"], group: "document" },
  { format: "png",  label: "PNG",          extensions: ["png"],                          mimes: ["image/png"], group: "image" },
  { format: "jpg",  label: "JPEG",         extensions: ["jpg", "jpeg"],                  mimes: ["image/jpeg"], group: "image" },
  { format: "webp", label: "WebP",         extensions: ["webp"],                         mimes: ["image/webp"], group: "image" },
  { format: "gif",  label: "GIF",          extensions: ["gif"],                          mimes: ["image/gif"], group: "image" },
  { format: "bmp",  label: "BMP",          extensions: ["bmp"],                          mimes: ["image/bmp"], group: "image" },
];

export interface ConversionOptions {
  rotate?: { angle?: 90 | 180 | 270; pages?: string }; // pages: "all" or "1,3,5" or "1-3"
  split?: { ranges?: string[] };                       // e.g. ["1-3","4-5","6"]; default: every page
  watermark?: {
    text?: string;
    fontSize?: number;
    opacity?: number;   // 0.1–1
    rotation?: number;  // degrees
    color?: string;     // hex
  };
  compress?: { level?: "low" | "medium" | "high" | "lossless" };
  pdfImage?: { format?: "png" | "jpeg"; scale?: number; pages?: string };
}

export interface ConversionDef {
  id: string;
  from: string[];                 // source formats (extensions)
  to: string;                     // target format
  engine: Engine;
  location: Location;
  category: Category;
  label: string;                  // "Word to PDF"
  shortLabel: string;             // "Word → PDF"
  maxSizeMB: number;
  priceCredits: number;
  description: string;
  optionsSchema?: z.ZodType<ConversionOptions>;
}

const OPTIONS = {
  rotate: z.object({
    rotate: z.object({
      angle: z.union([z.literal(90), z.literal(180), z.literal(270)]),
      pages: z.string().optional(),
    }).optional(),
  }),
  split: z.object({
    split: z.object({
      ranges: z.array(z.string()).optional(),
    }).optional(),
  }),
  watermark: z.object({
    watermark: z.object({
      text: z.string().min(1).max(200),
      fontSize: z.number().min(8).max(72).optional(),
      opacity: z.number().min(0.1).max(1).optional(),
      rotation: z.number().optional(),
      color: z.string().optional(),
    }).optional(),
  }),
  compress: z.object({
    compress: z.object({
      level: z.enum(["low", "medium", "high", "lossless"]).optional(),
    }).optional(),
  }),
  pdfImage: z.object({
    pdfImage: z.object({
      format: z.enum(["png", "jpeg"]).optional(),
      scale: z.number().min(0.5).max(4).optional(),
      pages: z.string().optional(),
    }).optional(),
  }),
} satisfies Record<string, z.ZodType<ConversionOptions>>;

export const CONVERSIONS: ConversionDef[] = [
  // ---------- Office → PDF ----------
  { id: "docx-pdf",  from: ["docx", "doc"], to: "pdf", engine: "libreoffice", location: "server", category: "office-to-pdf", label: "Word to PDF", shortLabel: "Word → PDF", maxSizeMB: 100, priceCredits: 1, description: "Convert Word documents to PDF with embedded fonts and stable layout." },
  { id: "pptx-pdf",  from: ["pptx", "ppt"], to: "pdf", engine: "libreoffice", location: "server", category: "office-to-pdf", label: "PowerPoint to PDF", shortLabel: "PowerPoint → PDF", maxSizeMB: 100, priceCredits: 1, description: "Turn slide decks into print-ready PDFs, one slide per page." },
  { id: "xlsx-pdf",  from: ["xlsx", "xls"], to: "pdf", engine: "libreoffice", location: "server", category: "office-to-pdf", label: "Excel to PDF", shortLabel: "Excel → PDF", maxSizeMB: 100, priceCredits: 1, description: "Spreadsheets to PDF with print areas and one sheet per page." },
  { id: "csv-pdf",   from: ["csv"],         to: "pdf", engine: "libreoffice", location: "server", category: "office-to-pdf", label: "CSV to PDF", shortLabel: "CSV → PDF", maxSizeMB: 25,  priceCredits: 1, description: "CSV data rendered as a clean, print-ready table." },
  { id: "rtf-pdf",   from: ["rtf"],         to: "pdf", engine: "libreoffice", location: "server", category: "office-to-pdf", label: "RTF to PDF", shortLabel: "RTF → PDF", maxSizeMB: 25,  priceCredits: 1, description: "Rich text format documents to PDF." },
  { id: "epub-pdf",  from: ["epub"],        to: "pdf", engine: "libreoffice", location: "server", category: "office-to-pdf", label: "EPUB to PDF", shortLabel: "EPUB → PDF", maxSizeMB: 50,  priceCredits: 1, description: "eBooks to PDF for printing and sharing." },

  // ---------- PDF → Office ----------
  { id: "pdf-docx",  from: ["pdf"], to: "docx", engine: "libreoffice", location: "server", category: "pdf-to-office", label: "PDF to Word", shortLabel: "PDF → Word", maxSizeMB: 100, priceCredits: 2, description: "Rebuild PDF text as an editable Word document. Best for text-based PDFs." },
  { id: "pdf-xlsx",  from: ["pdf"], to: "xlsx", engine: "libreoffice", location: "server", category: "pdf-to-office", label: "PDF to Excel", shortLabel: "PDF → Excel", maxSizeMB: 100, priceCredits: 2, description: "Extract tables from PDFs into an editable spreadsheet." },
  { id: "pdf-pptx",  from: ["pdf"], to: "pptx", engine: "libreoffice", location: "server", category: "pdf-to-office", label: "PDF to PowerPoint", shortLabel: "PDF → PowerPoint", maxSizeMB: 100, priceCredits: 3, description: "PDF pages into editable slides. Layout fidelity varies with complex designs." },

  // ---------- Office → Office ----------
  { id: "pptx-docx", from: ["pptx", "ppt"], to: "docx", engine: "libreoffice", location: "server", category: "office-to-office", label: "PowerPoint to Word", shortLabel: "PowerPoint → Word", maxSizeMB: 100, priceCredits: 2, description: "Slide content into a Word outline you can edit." },
  { id: "docx-xlsx", from: ["docx", "doc"], to: "xlsx", engine: "libreoffice", location: "server", category: "office-to-office", label: "Word to Excel", shortLabel: "Word → Excel", maxSizeMB: 100, priceCredits: 2, description: "Word content into a spreadsheet. Best for tabular documents." },
  { id: "csv-xlsx",  from: ["csv"],         to: "xlsx", engine: "libreoffice", location: "server", category: "office-to-office", label: "CSV to Excel", shortLabel: "CSV → Excel", maxSizeMB: 25, priceCredits: 1, description: "CSV into a native .xlsx workbook." },
  { id: "docx-html", from: ["docx", "doc"], to: "html", engine: "libreoffice", location: "server", category: "office-to-office", label: "Word to HTML", shortLabel: "Word → HTML", maxSizeMB: 50, priceCredits: 1, description: "Word documents to clean, web-ready HTML." },

  // ---------- Web / text → PDF ----------
  { id: "html-pdf",  from: ["html", "htm"], to: "pdf", engine: "libreoffice", location: "server", category: "web", label: "HTML to PDF", shortLabel: "HTML → PDF", maxSizeMB: 25, priceCredits: 1, description: "Web pages and HTML files to PDF, honoring inline CSS." },
  { id: "md-pdf",    from: ["md"],          to: "pdf", engine: "libreoffice", location: "server", category: "web", label: "Markdown to PDF", shortLabel: "Markdown → PDF", maxSizeMB: 10, priceCredits: 1, description: "Markdown rendered with clean editorial typography to PDF." },
  { id: "txt-pdf",   from: ["txt"],         to: "pdf", engine: "libreoffice", location: "server", category: "web", label: "Text to PDF", shortLabel: "Text → PDF", maxSizeMB: 10, priceCredits: 1, description: "Plain text to a tidy, printable PDF." },

  // ---------- PDF tools (client-side, private by default) ----------
  { id: "pdf-merge",      from: ["pdf"], to: "pdf", engine: "pdf-lib", location: "client", category: "pdf-tools", label: "Merge PDF", shortLabel: "Merge", maxSizeMB: 200, priceCredits: 1, description: "Combine multiple PDFs in order. Runs on your device — nothing is uploaded." },
  { id: "pdf-split",      from: ["pdf"], to: "pdf", engine: "pdf-lib", location: "client", category: "pdf-tools", label: "Split PDF", shortLabel: "Split", maxSizeMB: 100, priceCredits: 1, description: "Extract page ranges as separate PDFs. Runs on your device." },
  { id: "pdf-rotate",     from: ["pdf"], to: "pdf", engine: "pdf-lib", location: "client", category: "pdf-tools", label: "Rotate PDF", shortLabel: "Rotate", maxSizeMB: 100, priceCredits: 1, description: "Rotate all or selected pages 90/180/270 degrees. Runs on your device.", optionsSchema: OPTIONS.rotate },
  { id: "pdf-watermark",  from: ["pdf"], to: "pdf", engine: "pdf-lib", location: "client", category: "pdf-tools", label: "Watermark PDF", shortLabel: "Watermark", maxSizeMB: 100, priceCredits: 1, description: "Add a text watermark to every page. Runs on your device.", optionsSchema: OPTIONS.watermark },
  { id: "pdf-compress",   from: ["pdf"], to: "pdf", engine: "pdf-lib", location: "client", category: "pdf-tools", label: "Compress PDF", shortLabel: "Compress", maxSizeMB: 100, priceCredits: 1, description: "Reduce PDF size. High level re-encodes pages; lossless strips redundancy. Runs on your device.", optionsSchema: OPTIONS.compress },
  { id: "pdf-txt",        from: ["pdf"], to: "txt", engine: "pdfjs",  location: "client", category: "text", label: "PDF to Text", shortLabel: "PDF → Text", maxSizeMB: 50, priceCredits: 1, description: "Extract text from PDFs. Runs on your device." },
  { id: "pdf-md",         from: ["pdf"], to: "md",  engine: "pdfjs",  location: "client", category: "text", label: "PDF to Markdown", shortLabel: "PDF → Markdown", maxSizeMB: 50, priceCredits: 1, description: "PDF text as Markdown. Runs on your device." },
  { id: "pdf-image",      from: ["pdf"], to: "png", engine: "pdfjs",  location: "client", category: "image", label: "PDF to Image", shortLabel: "PDF → Image", maxSizeMB: 50, priceCredits: 1, description: "Render PDF pages as PNG images. Runs on your device.", optionsSchema: OPTIONS.pdfImage },
  { id: "image-pdf",      from: ["png", "jpg", "jpeg", "webp", "gif", "bmp"], to: "pdf", engine: "client", location: "client", category: "image", label: "Image to PDF", shortLabel: "Image → PDF", maxSizeMB: 50, priceCredits: 1, description: "Images into a single PDF, one per page. Runs on your device." },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const extToFormat = new Map<string, string>();
for (const f of FORMATS) for (const e of f.extensions) extToFormat.set(e, f.format);

const mimeToFormat = new Map<string, string>();
for (const f of FORMATS) for (const m of f.mimes) mimeToFormat.set(m, f.format);

/** Detect the canonical format from filename + optional mime type. */
export function detectFormat(filename: string, mime?: string | null): string | null {
  const ext = filename.toLowerCase().split(".").pop();
  if (ext) {
    const byExt = extToFormat.get(ext);
    if (byExt) return byExt;
  }
  if (mime) return mimeToFormat.get(mime.toLowerCase()) ?? null;
  return null;
}

export function formatDef(format: string): FormatDef | undefined {
  return FORMATS.find((f) => f.format === format);
}

export function conversionById(id: string): ConversionDef | undefined {
  return CONVERSIONS.find((c) => c.id === id);
}

/** Conversions whose `from` includes the given source format. */
export function conversionsFrom(source: string): ConversionDef[] {
  return CONVERSIONS.filter((c) => c.from.includes(source));
}

/** The single conversion for source → target, if it exists. */
export function findConversion(source: string, target: string): ConversionDef | undefined {
  return CONVERSIONS.find((c) => c.from.includes(source) && c.to === target);
}

/** Canonical output extension for a target format. */
export function extensionFor(format: string): string {
  return formatDef(format)?.extensions[0] ?? format;
}

/** Serialized catalog for the API (no zod schemas / functions). */
export function publicCatalog() {
  return CONVERSIONS.map((c) => ({
    id: c.id,
    from: c.from,
    to: c.to,
    engine: c.engine,
    location: c.location,
    category: c.category,
    label: c.label,
    shortLabel: c.shortLabel,
    maxSizeMB: c.maxSizeMB,
    priceCredits: c.priceCredits,
    description: c.description,
  }));
}
