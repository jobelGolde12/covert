/**
 * Client engine Web Worker — documentation/architecture.md §4.
 * Receives ArrayBuffers, runs the operation entirely on-device,
 * transfers the resulting ArrayBuffers back to the main thread.
 */

import {
  mergePdfs,
  splitPdf,
  rotatePdf,
  watermarkPdf,
  compressPdfLossless,
  type WatermarkOptions,
} from "./ops-lib";

export interface ConvertRequest {
  type: "convert";
  requestId: string;
  defId: string;
  files: ArrayBuffer[];
  mimes: string[];
  names: string[];
  options?: Record<string, unknown>;
}

export interface WorkerMessage {
  type: "progress" | "result" | "error";
  requestId: string;
  percent?: number;
  stage?: string;
  buffers?: ArrayBuffer[];
  mimes?: string[];
  names?: string[];
  code?: string;
  message?: string;
}

let pdfjsOps: typeof import("./ops-pdfjs") | null = null;

async function getPdfjs() {
  if (!pdfjsOps) pdfjsOps = await import("./ops-pdfjs");
  return pdfjsOps;
}

function post(msg: WorkerMessage, transfer?: Transferable[]) {
  (self as unknown as Worker).postMessage(msg, transfer ?? []);
}

self.onmessage = async (e: MessageEvent<ConvertRequest>) => {
  const req = e.data;
  if (!req || req.type !== "convert") return;

  const emit = (percent: number, stage?: string) =>
    post({ type: "progress", requestId: req.requestId, percent, stage });

  try {
    const bufs = req.files.map((f) => new Uint8Array(f));
    let out: Uint8Array[];
    let outMimes: string[];
    let outNames: string[];

    switch (req.defId) {
      case "pdf-merge": {
        emit(10, "Merging");
        const merged = await mergePdfs(bufs);
        out = [merged];
        outMimes = ["application/pdf"];
        outNames = [(req.names[0]?.replace(/\.[^.]+$/, "") ?? "doc") + "-merged.pdf"];
        break;
      }
      case "pdf-split": {
        emit(10, "Splitting");
        const ranges = (req.options?.split as { ranges?: string[] } | undefined)?.ranges;
        const parts = await splitPdf(bufs[0], ranges);
        const base = req.names[0]?.replace(/\.[^.]+$/, "") ?? "split";
        out = parts;
        outMimes = parts.map(() => "application/pdf");
        outNames = parts.map((_, i) => (parts.length === 1 && ranges?.length === 1 ? `${base}.pdf` : `${base}-${i + 1}.pdf`));
        break;
      }
      case "pdf-rotate": {
        emit(10, "Rotating");
        const o = req.options?.rotate as { angle?: 90 | 180 | 270; pages?: string } | undefined;
        const rotated = await rotatePdf(bufs[0], o?.angle ?? 90, o?.pages);
        out = [rotated];
        outMimes = ["application/pdf"];
        outNames = [req.names[0]?.replace(/\.[^.]+$/, "") + "-rotated.pdf"];
        break;
      }
      case "pdf-watermark": {
        emit(10, "Watermarking");
        const o = (req.options?.watermark ?? { text: "DRAFT" }) as WatermarkOptions;
        const marked = await watermarkPdf(bufs[0], o);
        out = [marked];
        outMimes = ["application/pdf"];
        outNames = [req.names[0]?.replace(/\.[^.]+$/, "") + "-watermarked.pdf"];
        break;
      }
      case "pdf-compress": {
        const level = (req.options?.compress as { level?: string } | undefined)?.level ?? "medium";
        if (level === "lossless") {
          emit(30, "Optimizing");
          const outBuf = await compressPdfLossless(bufs[0]);
          out = [outBuf];
        } else {
          const pdfjs = await getPdfjs();
          const outBuf = await pdfjs.compressPdfViaRender(bufs[0], level as "low" | "medium" | "high", emit);
          out = [outBuf];
        }
        outMimes = ["application/pdf"];
        outNames = [req.names[0]?.replace(/\.[^.]+$/, "") + "-compressed.pdf"];
        break;
      }
      case "pdf-txt": {
        const pdfjs = await getPdfjs();
        const text = await pdfjs.pdfToText(bufs[0], emit);
        out = [new TextEncoder().encode(text)];
        outMimes = ["text/plain"];
        outNames = [req.names[0]?.replace(/\.[^.]+$/, "") + ".txt"];
        break;
      }
      case "pdf-md": {
        const pdfjs = await getPdfjs();
        const md = await pdfjs.pdfToMarkdown(bufs[0], emit);
        out = [new TextEncoder().encode(md)];
        outMimes = ["text/markdown"];
        outNames = [req.names[0]?.replace(/\.[^.]+$/, "") + ".md"];
        break;
      }
      case "pdf-image": {
        const pdfjs = await getPdfjs();
        const o = req.options?.pdfImage as { format?: "png" | "jpeg"; scale?: number; pages?: string } | undefined;
        const imgs = await pdfjs.pdfToImages(bufs[0], { format: o?.format, scale: o?.scale, pages: o?.pages }, emit);
        out = await Promise.all(imgs.map(async (im) => new Uint8Array(await im.blob.arrayBuffer())));
        outMimes = imgs.map(() => (o?.format === "jpeg" ? "image/jpeg" : "image/png"));
        outNames = imgs.map((im) => `${req.names[0]?.replace(/\.[^.]+$/, "") ?? "page"}-page-${im.page}.${o?.format === "jpeg" ? "jpg" : "png"}`);
        break;
      }
      case "image-pdf": {
        emit(5, "Preparing images");
        const pdfjs = await getPdfjs();
        const blobs = req.files.map((f, i) => new Blob([f], { type: req.mimes[i] ?? "image/jpeg" }));
        const pdf = await pdfjs.imagesToPdf(blobs, req.mimes, emit);
        out = [pdf];
        outMimes = ["application/pdf"];
        outNames = [req.names[0]?.replace(/\.[^.]+$/, "") + ".pdf"];
        break;
      }
      default:
        throw new Error(`Unknown conversion: ${req.defId}`);
    }

    emit(100, "Done");
    const transfer = out.filter((b) => b.buffer instanceof ArrayBuffer).map((b) => b.buffer);
    post(
      {
        type: "result",
        requestId: req.requestId,
        buffers: out as unknown as ArrayBuffer[],
        mimes: outMimes,
        names: outNames,
      },
      transfer
    );
  } catch (err) {
    post({
      type: "error",
      requestId: req.requestId,
      code: "CONVERSION_FAILED",
      message: err instanceof Error ? err.message : "Conversion failed",
    });
  }
};
