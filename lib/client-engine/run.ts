"use client";

import type { ConversionDef } from "@/lib/conversions";
import type { ConvertRequest, WorkerMessage } from "./worker";

/**
 * Browser facade for client-side conversions (documentation/architecture.md §4).
 * Files never leave the device — there is no upload path in this module.
 */

export interface ClientResult {
  blobs: Blob[];
  names: string[];
  mimes: string[];
}

let worker: Worker | null = null;

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
  worker.onerror = () => {
    // allow re-spawn on next call
    worker = null;
  };
  return worker;
}

export async function runClientConversion(
  def: ConversionDef,
  files: File[],
  options?: Record<string, unknown>,
  onProgress?: (percent: number, stage?: string) => void
): Promise<ClientResult> {
  const w = getWorker();

  const buffers = await Promise.all(files.map((f) => f.arrayBuffer()));

  return new Promise<ClientResult>((resolve, reject) => {
    const requestId = `${def.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const handler = (e: MessageEvent<WorkerMessage>) => {
      const msg = e.data;
      if (!msg || msg.requestId !== requestId) return;
      switch (msg.type) {
        case "progress":
          onProgress?.(msg.percent ?? 0, msg.stage);
          break;
        case "result": {
          w.removeEventListener("message", handler);
          const blobs = (msg.buffers ?? []).map((b, i) => new Blob([b], { type: msg.mimes?.[i] ?? "application/octet-stream" }));
          resolve({ blobs, names: msg.names ?? [], mimes: msg.mimes ?? [] });
          break;
        }
        case "error": {
          w.removeEventListener("message", handler);
          reject(new Error(msg.message ?? "Conversion failed"));
          break;
        }
      }
    };
    w.addEventListener("message", handler);

    const req: ConvertRequest = {
      type: "convert",
      requestId,
      defId: def.id,
      files: buffers,
      mimes: files.map((f) => f.type),
      names: files.map((f) => f.name),
      options,
    };
    w.postMessage(req, buffers);
  });
}

export function supportsClientEngine(): boolean {
  return typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";
}
