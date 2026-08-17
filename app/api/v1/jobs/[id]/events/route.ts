import { NextRequest } from "next/server";
import { apiError } from "@/lib/api";
import { getJobForApi } from "@/lib/jobs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TERMINAL = new Set(["done", "error", "cancelled"]);

/**
 * GET /api/v1/jobs/:id/events — Server-Sent Events stream.
 * Emits `job` events whenever the job state changes; closes on terminal state.
 * (Documentation/architecture.md §6 — WebSocket in production, SSE + polling here.)
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const job = await getJobForApi(params.id);
  if (!job) return apiError("NOT_FOUND", "Job not found", 404);

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let lastPayload = "";
      let closed = false;
      let heartbeat: ReturnType<typeof setInterval> | null = null;
      let pollTimer: ReturnType<typeof setInterval> | null = null;

      const send = (payload: string) => {
        controller.enqueue(encoder.encode(`event: job\ndata: ${payload}\n\n`));
      };

      const close = () => {
        if (closed) return;
        closed = true;
        if (heartbeat) clearInterval(heartbeat);
        if (pollTimer) clearInterval(pollTimer);
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      const poll = async () => {
        if (closed) return;
        const current = await getJobForApi(params.id);
        if (!current) {
          close();
          return;
        }
        const payload = JSON.stringify(current);
        if (payload !== lastPayload) {
          lastPayload = payload;
          send(payload);
        }
        if (TERMINAL.has(current.status)) close();
      };

      request.signal.addEventListener("abort", close);

      // initial snapshot
      const initial = await getJobForApi(params.id);
      if (!initial) {
        close();
        return;
      }
      lastPayload = JSON.stringify(initial);
      send(lastPayload);
      if (TERMINAL.has(initial.status)) {
        close();
        return;
      }

      heartbeat = setInterval(() => controller.enqueue(encoder.encode(": ping\n\n")), 15000);
      pollTimer = setInterval(poll, 600);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
